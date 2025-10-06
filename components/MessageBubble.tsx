"use client";

import { Message } from "@/types";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-green-500 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        {message.mediaUrl && (
          <div className="mb-2">
            {message.mediaType === "image" && (
              <img
                src={message.mediaUrl}
                alt="Imagem"
                className="rounded max-w-full h-auto"
              />
            )}
            {message.mediaType === "video" && (
              <video
                src={message.mediaUrl}
                controls
                className="rounded max-w-full h-auto"
              />
            )}
            {message.mediaType === "audio" && (
              <audio src={message.mediaUrl} controls className="w-full" />
            )}
            {message.mediaType === "document" && (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Baixar documento
              </a>
            )}
          </div>
        )}
        {message.text && <p className="break-words">{message.text}</p>}
        <div
          className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
            isOwn ? "text-green-100" : "text-gray-500"
          }`}
        >
          <span>{format(message.timestamp, "HH:mm")}</span>
          {isOwn && (
            <span>
              {message.status === "sent" && <Check size={14} />}
              {message.status === "delivered" && <CheckCheck size={14} />}
              {message.status === "read" && (
                <CheckCheck size={14} className="text-blue-300" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
