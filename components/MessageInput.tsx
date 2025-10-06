"use client";

import { Mic, Paperclip, Send, Smile } from "lucide-react";
import { useRef, useState } from "react";

interface MessageInputProps {
  chatId: string;
  senderId: string;
  recipientPhone: string;
}

export default function MessageInput({
  chatId,
  senderId,
  recipientPhone,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          senderId,
          to: recipientPhone,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessage("");
      } else {
        console.error("Failed to send message");
        alert("Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      // Upload file to Firebase Storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", chatId);
      formData.append("senderId", senderId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { mediaUrl, mediaType } = await uploadResponse.json();

      // Send media message
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          senderId,
          to: recipientPhone,
          message: message.trim() || undefined,
          mediaUrl,
          mediaType,
        }),
      });

      if (response.ok) {
        setMessage("");
      } else {
        console.error("Failed to send media message");
        alert("Erro ao enviar mídia");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gray-100 border-t border-gray-300 px-4 py-3">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200"
        >
          <Paperclip size={22} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem"
            disabled={isSending}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-green-500 pr-10"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900">
            <Smile size={20} />
          </button>
        </div>

        {message.trim() ? (
          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={22} />
          </button>
        ) : (
          <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200">
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
