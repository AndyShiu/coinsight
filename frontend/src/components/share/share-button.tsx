"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog, type ShareDialogProps } from "./share-dialog";

type ShareButtonProps = Omit<ShareDialogProps, "open" | "onOpenChange">;

export function ShareButton(props: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="w-4 h-4 mr-1.5" />
        分享
      </Button>
      <ShareDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}
