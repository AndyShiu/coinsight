"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getApiKeys, updateApiKeys, deleteApiKey } from "@/lib/api/settings";
import type { ApiKeyStatus, ApiKeysUpdateRequest } from "@/lib/types/settings";
import { WatchlistEditorDialog } from "@/components/settings/watchlist-editor-dialog";
import { DashboardPinsEditor } from "@/components/settings/dashboard-pins-editor";
import { useAppStore } from "@/lib/stores/app-store";

export default function SettingsPage() {
  const watchlist = useAppStore((s) => s.watchlist);
  const dashboardPins = useAppStore((s) => s.dashboardPins);
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Auto-dismiss message after 4 seconds
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(id);
  }, [message]);

  const fetchKeys = async () => {
    try {
      const res = await getApiKeys();
      setKeys(res.keys);
    } catch {
      setMessage({ type: "err", text: "無法載入 API Key 狀態" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSave = async () => {
    const payload: ApiKeysUpdateRequest = {};
    for (const [k, v] of Object.entries(inputs)) {
      if (v.trim()) {
        (payload as Record<string, string>)[k] = v.trim();
      }
    }

    if (Object.keys(payload).length === 0) {
      setMessage({ type: "err", text: "請至少填入一個 API Key" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await updateApiKeys(payload);
      setKeys(res.keys);
      setInputs({});
      setMessage({ type: "ok", text: "儲存成功" });
    } catch {
      setMessage({ type: "err", text: "儲存失敗，請重試" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteApiKey(name);
      await fetchKeys();
      setMessage({ type: "ok", text: "已刪除" });
    } catch {
      setMessage({ type: "err", text: "刪除失敗" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">設定</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理外部 API Key，設定後存入本地資料庫。有 API Key 可解鎖更多數據來源。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {keys.map((key) => (
            <div key={key.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={key.name} className="text-sm font-medium">
                  {key.label}
                </Label>
                {key.is_set ? (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">
                    已設定
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    未設定
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{key.description}</p>
              <div className="flex items-center gap-2">
                <Input
                  id={key.name}
                  type="password"
                  placeholder={key.masked_value ?? "輸入 API Key..."}
                  value={inputs[key.name] ?? ""}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [key.name]: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
                {key.is_set && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 shrink-0"
                      >
                        刪除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除</AlertDialogTitle>
                        <AlertDialogDescription>
                          確定要刪除 {key.label} 嗎？刪除後相關功能將無法使用。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(key.name)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}

          {message && (
            <p className={`text-sm transition-opacity ${message.type === "ok" ? "text-emerald-500" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>關注清單</CardTitle>
            <WatchlistEditorDialog />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            管理您追蹤的幣種，Sidebar 和搜尋預設清單會同步更新。
          </p>
          <div className="flex flex-wrap gap-2">
            {watchlist.map((symbol) => (
              <Badge key={symbol} variant="secondary">
                {symbol}
              </Badge>
            ))}
            {watchlist.length === 0 && (
              <p className="text-xs text-muted-foreground">尚未加入任何幣種</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dashboard 置頂</CardTitle>
            <DashboardPinsEditor />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            選擇要在 Dashboard 首頁顯示快速訊號卡片的幣種。
          </p>
          <div className="flex flex-wrap gap-2">
            {dashboardPins.map((symbol) => (
              <Badge key={symbol} variant="default">
                {symbol}
              </Badge>
            ))}
            {dashboardPins.length === 0 && (
              <p className="text-xs text-muted-foreground">尚未選擇任何幣種</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
