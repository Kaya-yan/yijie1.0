"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  Key,
  Cpu,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, ModelConfig, defaultModels } from "@/lib/store";
import { testConnection } from "@/lib/api/client";

export default function SettingsPage() {
  useAuth();
  const { models, setModels, updateModel, addModel, removeModel } = useStore();
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [customModel, setCustomModel] = useState({
    name: "",
    provider: "",
    apiKey: "",
    baseUrl: "",
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; error?: string }>>({});
  const [resetDone, setResetDone] = useState(false);

  const handleTestConnection = async (modelId: string) => {
    setTesting((prev) => ({ ...prev, [modelId]: true }));
    setTestResults((prev) => ({ ...prev, [modelId]: undefined as any }));

    try {
      const currentModel = models.find((m) => m.id === modelId);
      const result = await testConnection(modelId, currentModel);
      setTestResults((prev) => ({ ...prev, [modelId]: result }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [modelId]: { success: false, error: "测试失败" },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [modelId]: false }));
    }
  };

  const handleUpdateModel = (id: string, field: keyof ModelConfig, value: string | boolean) => {
    updateModel(id, { [field]: value });
    // Clear test result when config changes
    setTestResults((prev) => ({ ...prev, [id]: undefined as any }));
  };

  const handleAddCustomModel = () => {
    if (!customModel.name || !customModel.baseUrl) return;
    const newModel: ModelConfig = {
      id: `custom-${Date.now()}`,
      name: customModel.name,
      provider: customModel.provider || "自定义",
      apiKey: customModel.apiKey,
      baseUrl: customModel.baseUrl,
      enabled: true,
    };
    addModel(newModel);
    setCustomModel({ name: "", provider: "", apiKey: "", baseUrl: "" });
  };

  const handleRemoveModel = (id: string) => {
    removeModel(id);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const configuredCount = models.filter((m) => m.apiKey).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">API 设置</h1>
          <p className="text-gray-500">配置大模型 API，连接 AI 服务</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary" className={configuredCount > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}>
              {configuredCount > 0 ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  已配置 {configuredCount} 个模型
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  未配置任何模型
                </>
              )}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="models" className="space-y-6 section-enter section-enter-1">
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="models" className="gap-2">
              <Key className="w-4 h-4" />
              模型配置
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Plus className="w-4 h-4" />
              自定义模型
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4">
            {models.map((model) => {
              const testResult = testResults[model.id];
              const isTesting = testing[model.id];

              return (
                <Card key={model.id} className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{model.name}</h3>
                          <p className="text-sm text-gray-500">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResult && (
                          <Badge
                            variant="secondary"
                            className={`gap-1 ${
                              testResult.success
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {testResult.success ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                成功 {testResult.latency && `${testResult.latency}ms`}
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                失败
                              </>
                            )}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveModel(model.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">API 地址</label>
                        <Input
                          value={model.baseUrl}
                          onChange={(e) => handleUpdateModel(model.id, "baseUrl", e.target.value)}
                          placeholder="https://api.example.com/v1"
                          className="h-10 bg-gray-50 border-gray-200 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
                        <div className="relative">
                          <Input
                            type={showApiKey[model.id] ? "text" : "password"}
                            value={model.apiKey}
                            onChange={(e) => handleUpdateModel(model.id, "apiKey", e.target.value)}
                            placeholder="sk-..."
                            className="h-10 bg-gray-50 border-gray-200 font-mono text-sm pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() =>
                              setShowApiKey((prev) => ({ ...prev, [model.id]: !prev[model.id] }))
                            }
                          >
                            {showApiKey[model.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        {testResult && !testResult.success && testResult.error && (
                          <p className="mt-1 text-xs text-red-500">{testResult.error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(model.id)}
                          disabled={isTesting || !model.apiKey}
                          className="gap-1.5"
                        >
                          {isTesting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <TestTube className="w-3.5 h-3.5" />
                          )}
                          测试连接
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModels(defaultModels);
                  setResetDone(true);
                  setTimeout(() => setResetDone(false), 2000);
                }}
                className="gap-2"
              >
                {resetDone ? <CheckCircle className="w-4 h-4" /> : null}
                {resetDone ? "已重置" : "重置默认"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">添加自定义模型</CardTitle>
                <CardDescription>接入任何兼容 OpenAI API 格式的模型服务</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">模型名称</label>
                    <Input
                      value={customModel.name}
                      onChange={(e) => setCustomModel((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Model"
                      className="h-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">提供商</label>
                    <Input
                      value={customModel.provider}
                      onChange={(e) => setCustomModel((prev) => ({ ...prev, provider: e.target.value }))}
                      placeholder="自定义"
                      className="h-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">API 地址</label>
                  <Input
                    value={customModel.baseUrl}
                    onChange={(e) => setCustomModel((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="h-10 bg-gray-50 border-gray-200 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
                  <Input
                    type="password"
                    value={customModel.apiKey}
                    onChange={(e) => setCustomModel((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="h-10 bg-gray-50 border-gray-200 font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleAddCustomModel}
                  disabled={!customModel.name || !customModel.baseUrl}
                  className="bg-gray-900 hover:bg-gray-800 shadow-sm gap-2 btn-press"
                >
                  <Plus className="w-4 h-4" />
                  添加模型
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Guide */}
        <Card className="mt-8 bg-blue-50 border-blue-200 section-enter section-enter-2">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" />
              快速配置指南
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Kimi (月之暗面):</strong> 访问 platform.moonshot.cn 注册，获取 API Key</p>
              <p><strong>DeepSeek:</strong> 访问 platform.deepseek.com 注册，获取 API Key</p>
              <p><strong>通义千问:</strong> 访问 dashscope.console.aliyun.com 注册，获取 API Key</p>
              <p><strong>智谱清言:</strong> 访问 open.bigmodel.cn 注册，获取 API Key</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
          <AlertCircle className="w-3 h-3" />
          <span>API Key 存储在浏览器本地，不会上传到任何服务器。请勿在公共设备上保存敏感密钥。</span>
        </div>
      </main>
    </div>
  );
}
