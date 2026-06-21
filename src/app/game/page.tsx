"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { RotateCcw, Trophy, Gamepad2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function GamePage() {
  useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const deathCountRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("dino-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    const width = 960;
    const height = 400;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    let animationId: number;
    let frame = 0;
    let gameSpeed = 4;
    let isGameOver = false;
    let isStarted = false;
    let currentScore = 0;

    const groundY = height - 40;

    const dino = {
      x: 50,
      y: groundY - 47,
      width: 56,
      height: 47,
      dy: 0,
      jumpPower: -12,
      gravity: 0.55,
      grounded: true,
      ducking: false,
      legFrame: 0,
    };

    interface Obstacle {
      x: number;
      y: number;
      width: number;
      height: number;
      type: "cactus" | "bird";
      passed: boolean;
    }

    let obstacles: Obstacle[] = [];
    let obstacleTimer = 0;
    let clouds: { x: number; y: number; w: number }[] = [];
    let isNight = false;

    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * width,
        y: 30 + Math.random() * 60,
        w: 40 + Math.random() * 40,
      });
    }

    // Audio context - created lazily
    let audioCtx: AudioContext | null = null;

    function getAudioCtx(): AudioContext {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return audioCtx;
    }

    function playSound(frequency: number, duration: number, type: OscillatorType = "square") {
      if (!soundEnabledRef.current) return;
      try {
        const ctx = getAudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
      } catch (e) {
        // Ignore audio errors
      }
    }

    function drawDino() {
      ctx!.save();
      ctx!.translate(dino.x, dino.y);
      const c = isNight ? "#f7f7f7" : "#535353";
      const bg = isNight ? "#1a1a2e" : "#ffffff";
      ctx!.fillStyle = c;

      if (dino.ducking && dino.grounded) {
        // Ducking: flattened body, long head
        ctx!.fillRect(0, 8, 44, 16);  // body
        ctx!.fillRect(36, 4, 16, 12); // head
        ctx!.fillRect(44, 4, 8, 4);   // upper jaw
        ctx!.fillRect(44, 12, 8, 4);  // lower jaw
        ctx!.fillStyle = bg;
        ctx!.fillRect(48, 8, 3, 4);   // mouth gap
        ctx!.fillStyle = c;
        // eye
        ctx!.fillRect(40, 6, 3, 3);
        ctx!.fillStyle = bg;
        ctx!.fillRect(41, 7, 1, 1);
        ctx!.fillStyle = c;
        // legs
        const legOff = Math.floor(dino.legFrame / 5) % 2 === 0 ? 0 : 3;
        ctx!.fillRect(8, 24, 5, 8 - legOff);
        ctx!.fillRect(20, 24 + legOff, 5, 8 - legOff);
      } else {
        // Standing / jumping T-Rex
        // Tail
        ctx!.fillRect(0, 18, 10, 6);
        ctx!.fillRect(-4, 16, 6, 4);
        // Body
        ctx!.fillRect(8, 12, 20, 18);
        ctx!.fillRect(6, 14, 24, 14);
        // Neck
        ctx!.fillRect(24, 4, 12, 16);
        ctx!.fillRect(26, 2, 10, 4);
        // Head
        ctx!.fillRect(32, 0, 20, 14);
        ctx!.fillRect(36, -2, 14, 4);
        // Upper jaw
        ctx!.fillRect(44, 0, 12, 6);
        ctx!.fillRect(48, 2, 6, 4);
        // Lower jaw
        ctx!.fillRect(44, 8, 10, 4);
        ctx!.fillRect(48, 6, 6, 4);
        // Mouth gap
        ctx!.fillStyle = bg;
        ctx!.fillRect(46, 6, 8, 2);
        // Eye
        ctx!.fillStyle = bg;
        ctx!.fillRect(38, 4, 4, 4);
        ctx!.fillStyle = c;
        ctx!.fillRect(39, 5, 2, 2);
        // Tiny arm
        ctx!.fillStyle = c;
        ctx!.fillRect(28, 22, 4, 6);
        ctx!.fillRect(30, 26, 3, 3);

        // Legs
        if (!dino.grounded) {
          // Jumping: legs spread
          ctx!.fillRect(12, 30, 6, 14);
          ctx!.fillRect(24, 30, 6, 14);
          ctx!.fillRect(10, 42, 10, 3);
          ctx!.fillRect(22, 42, 10, 3);
        } else {
          // Running: alternating legs
          const step = Math.floor(dino.legFrame / 5) % 4;
          if (step === 0) {
            ctx!.fillRect(12, 30, 6, 12);
            ctx!.fillRect(24, 30, 6, 12);
            ctx!.fillRect(10, 40, 10, 3);
            ctx!.fillRect(22, 40, 10, 3);
          } else if (step === 1) {
            ctx!.fillRect(10, 30, 6, 14);
            ctx!.fillRect(26, 30, 6, 10);
            ctx!.fillRect(8, 42, 10, 3);
            ctx!.fillRect(24, 38, 10, 3);
          } else if (step === 2) {
            ctx!.fillRect(12, 30, 6, 12);
            ctx!.fillRect(24, 30, 6, 12);
            ctx!.fillRect(10, 40, 10, 3);
            ctx!.fillRect(22, 40, 10, 3);
          } else {
            ctx!.fillRect(26, 30, 6, 10);
            ctx!.fillRect(10, 30, 6, 14);
            ctx!.fillRect(24, 38, 10, 3);
            ctx!.fillRect(8, 42, 10, 3);
          }
        }
      }
      ctx!.restore();
    }

    function drawCactus(obs: Obstacle) {
      const green = isNight ? "#6b8e5a" : "#3d7a3d";
      const darkGreen = isNight ? "#4a6b3a" : "#2d5a2d";
      ctx!.fillStyle = green;
      const cx = obs.x + obs.width / 2;
      // Main trunk
      ctx!.fillRect(cx - 4, obs.y, 8, obs.height);
      // Trunk stripes
      ctx!.fillStyle = darkGreen;
      ctx!.fillRect(cx - 4, obs.y + 4, 2, obs.height - 8);
      ctx!.fillRect(cx + 1, obs.y + 8, 2, obs.height - 12);
      ctx!.fillStyle = green;
      if (obs.width > 20) {
        // Left arm
        ctx!.fillRect(obs.x, obs.y + 8, 6, 12);
        ctx!.fillRect(obs.x - 3, obs.y + 4, 6, 8);
        ctx!.fillRect(obs.x, obs.y + 4, 4, 4);
        ctx!.fillStyle = darkGreen;
        ctx!.fillRect(obs.x, obs.y + 6, 2, 10);
        ctx!.fillStyle = green;
      }
      if (obs.width > 30) {
        // Right arm
        ctx!.fillRect(obs.x + obs.width - 6, obs.y + 12, 6, 10);
        ctx!.fillRect(obs.x + obs.width - 3, obs.y + 8, 6, 6);
        ctx!.fillRect(obs.x + obs.width - 4, obs.y + 8, 4, 4);
        ctx!.fillStyle = darkGreen;
        ctx!.fillRect(obs.x + obs.width - 4, obs.y + 10, 2, 8);
        ctx!.fillStyle = green;
      }
      // Top spikes
      ctx!.fillRect(cx - 2, obs.y - 3, 4, 4);
      ctx!.fillRect(cx - 5, obs.y + 2, 3, 3);
      ctx!.fillRect(cx + 3, obs.y + 2, 3, 3);
    }

    function drawBird(obs: Obstacle) {
      ctx!.fillStyle = isNight ? "#c0392b" : "#e74c3c";
      ctx!.fillRect(obs.x + 6, obs.y + 6, 20, 10);
      ctx!.fillRect(obs.x + 20, obs.y + 2, 10, 8);
      const wingY = Math.sin(frame * 0.2) * 6;
      ctx!.fillRect(obs.x + 8, obs.y + 10 + wingY, 16, 4);
      ctx!.fillStyle = isNight ? "#f39c12" : "#f1c40f";
      ctx!.fillRect(obs.x + 28, obs.y + 4, 6, 4);
    }

    function drawGround() {
      ctx!.strokeStyle = isNight ? "#555" : "#ccc";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, groundY);
      ctx!.lineTo(width, groundY);
      ctx!.stroke();
      ctx!.fillStyle = isNight ? "#555" : "#bbb";
      for (let i = 0; i < width; i += 20) {
        const offset = ((frame * gameSpeed) % 20);
        ctx!.fillRect(i - offset, groundY + 4 + (i % 3) * 4, 2, 2);
      }
    }

    function drawClouds() {
      ctx!.fillStyle = isNight ? "#444" : "#ddd";
      clouds.forEach((cloud) => {
        ctx!.beginPath();
        ctx!.arc(cloud.x, cloud.y, cloud.w / 3, 0, Math.PI * 2);
        ctx!.arc(cloud.x + cloud.w / 4, cloud.y - 6, cloud.w / 4, 0, Math.PI * 2);
        ctx!.arc(cloud.x + cloud.w / 2, cloud.y, cloud.w / 3.5, 0, Math.PI * 2);
        ctx!.fill();
        cloud.x -= 0.3;
        if (cloud.x < -60) cloud.x = width + 20;
      });
    }

    function spawnObstacle() {
      const type = Math.random() > 0.7 ? "bird" : "cactus";
      if (type === "bird") {
        const heights = [groundY - 70, groundY - 50, groundY - 90];
        obstacles.push({
          x: width,
          y: heights[Math.floor(Math.random() * heights.length)],
          width: 34,
          height: 20,
          type: "bird",
          passed: false,
        });
      } else {
        const size = Math.floor(Math.random() * 3) + 1;
        obstacles.push({
          x: width,
          y: groundY - 20 - size * 12,
          width: 16 + size * 8,
          height: 20 + size * 12,
          type: "cactus",
          passed: false,
        });
      }
    }

    function checkCollision(obs: Obstacle): boolean {
      const dx = dino.x + 8;
      const dy = dino.ducking ? dino.y + 20 : dino.y + 4;
      const dw = dino.ducking ? 44 : dino.width - 16;
      const dh = dino.ducking ? 12 : dino.height - 8;
      return (
        dx < obs.x + obs.width - 4 &&
        dx + dw > obs.x + 4 &&
        dy < obs.y + obs.height - 4 &&
        dy + dh > obs.y + 4
      );
    }

    function gameLoop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isNight ? "#1a1a2e" : "#ffffff";
      ctx.fillRect(0, 0, width, height);
      drawClouds();
      drawGround();

      if (!isStarted) {
        drawDino();
        ctx.fillStyle = isNight ? "#fff" : "#535353";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("按空格键或点击开始", width / 2, height / 2 + 20);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = isNight ? "#aaa" : "#999";
        ctx.fillText("空格/↑ = 跳跃    ↓ = 下蹲", width / 2, height / 2 + 50);
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      if (isGameOver) {
        drawDino();
        obstacles.forEach((obs) => {
          if (obs.type === "cactus") drawCactus(obs);
          else drawBird(obs);
        });
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const deaths = deathCountRef.current;

        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("游戏结束", cx, cy - 30);
        ctx.font = "18px sans-serif";
        ctx.fillText(`得分: ${currentScore}`, cx, cy);

        // Easter egg hint
        if (deaths < 10) {
          const hintText = `隐藏彩蛋：连续阵亡 10 次解锁「熊大快跑」(${deaths}/10)`;
          ctx.font = "13px sans-serif";
          ctx.fillStyle = "#fbbf24";
          ctx.fillText(hintText, cx, cy + 30);
          // Progress bar
          const barW = 160, barH = 6, barX = cx - barW / 2, barY = cy + 40;
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.fill();
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW * (deaths / 10), barH, 3);
          ctx.fill();
        } else {
          ctx.font = "13px sans-serif";
          ctx.fillStyle = "#fbbf24";
          ctx.fillText("正在加载「熊大快跑」... 加载失败，你被耍了！", cx, cy + 30);
        }

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "13px sans-serif";
        ctx.fillText("按空格键重新开始", cx, cy + 60);
        return;
      }

      if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
        const landY = dino.ducking ? groundY - 28 : groundY - 47;
        if (dino.y >= landY) {
          dino.y = landY;
          dino.dy = 0;
          dino.grounded = true;
        }
      }

      if (dino.grounded && !dino.ducking) {
        dino.legFrame++;
      }

      obstacleTimer++;
      const spawnRate = Math.max(60, 120 - currentScore / 5);
      if (obstacleTimer > spawnRate) {
        spawnObstacle();
        obstacleTimer = 0;
      }

      obstacles = obstacles.filter((obs) => {
        obs.x -= gameSpeed;
        if (checkCollision(obs)) {
          isGameOver = true;
          setGameOver(true);
          setScore(currentScore);
          deathCountRef.current += 1;
          playSound(200, 0.3, "sawtooth");
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem("dino-highscore", currentScore.toString());
          }
        }
        if (!obs.passed && obs.x + obs.width < dino.x) {
          obs.passed = true;
          currentScore++;
          setScore(currentScore);
          playSound(600, 0.1);
          if (currentScore % 50 === 0) gameSpeed += 0.5;
          if (currentScore % 300 === 0) isNight = !isNight;
        }
        return obs.x > -50;
      });

      obstacles.forEach((obs) => {
        if (obs.type === "cactus") drawCactus(obs);
        else drawBird(obs);
      });
      drawDino();

      ctx.fillStyle = isNight ? "#fff" : "#535353";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`得分: ${currentScore}`, width - 20, 30);

      frame++;
      animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    const jump = () => {
      if (!isStarted) {
        isStarted = true;
        setStarted(true);
        playSound(400, 0.1);
        return;
      }
      if (isGameOver) {
        isGameOver = false;
        setGameOver(false);
        currentScore = 0;
        setScore(0);
        gameSpeed = 4;
        obstacles = [];
        obstacleTimer = 0;
        dino.y = groundY - 47;
        dino.height = 47;
        dino.ducking = false;
        dino.dy = 0;
        dino.grounded = true;
        isNight = false;
        playSound(500, 0.1);
        gameLoop();
        return;
      }
      if (dino.grounded) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
        playSound(500, 0.15);
      }
    };

    const duck = (down: boolean) => {
      if (down && !dino.ducking) {
        dino.ducking = true;
        dino.y = groundY - 28;
        dino.height = 28;
        if (!dino.grounded) dino.dy += 3;
      } else if (!down && dino.ducking) {
        dino.ducking = false;
        dino.y = groundY - 47;
        dino.height = 47;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") duck(false);
    };

    const handleClick = () => jump();

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      jump();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0].clientY - touchStartY > 30) duck(true);
    };
    const handleTouchEnd = () => duck(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []); // No dependencies - uses refs for sound state

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen pixel-grid" style={{ background: "var(--pixel-bg)" }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 pixel-border" style={{ background: "var(--pixel-blue)" }}>
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(12px, 3vw, 18px)", color: "var(--pixel-text)", lineHeight: "2" }}>恐龙跑酷</h1>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: "20px", color: "var(--pixel-text-light)" }}>按空格键跳跃，躲避障碍物！</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-2 px-4 py-2.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-500">最高分:</span>
              <span className="font-bold text-gray-900">{highScore}</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-2 px-4 py-2.5">
              <span className="text-sm text-gray-500">当前:</span>
              <span className="font-bold text-gray-900">{score}</span>
            </CardContent>
          </Card>
          <Button variant="outline" size="icon" onClick={toggleSound} className="h-10 w-10">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }))} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            重新开始
          </Button>
        </div>

        <div className="flex justify-center">
          <Card className="bg-white border-gray-200 shadow-lg overflow-hidden w-full" style={{ maxWidth: 960 }}>
            <canvas ref={canvasRef} className="cursor-pointer touch-none w-full block" style={{ aspectRatio: "960/400" }} />
          </Card>
        </div>

        <div className="text-center mt-4">
          <Badge variant="secondary" className="text-gray-500">
            {!started && !gameOver && "点击画面或按空格键开始游戏"}
            {gameOver && "游戏结束！点击画面或按空格键重新开始"}
            {started && !gameOver && "游戏中..."}
          </Badge>
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">操作说明</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">空格</kbd>
                  <span>/ ↑ 跳跃</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">↓</kbd>
                  <span>下蹲</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">点击</kbd>
                  <span>跳跃</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">下滑</kbd>
                  <span>下蹲</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
