import React from 'react'

type Props = {
  message: string
  isLoading?: boolean
}

export const ChatBubble = ({ message, isLoading = false }: Props) => {
  return (
    <div className="w-72 z-50">
      <div className="
        bg-white/90 dark:bg-gray-800/90 
        backdrop-blur-sm
        rounded-2xl shadow-lg p-4 relative
        border border-gray-200 dark:border-gray-700
      ">
        {/* 气泡尖角 - 指向下方 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-16px] w-0 h-0 
          border-l-[12px] border-l-transparent 
          border-r-[12px] border-r-transparent 
          border-t-[12px] border-t-gray-200 dark:border-t-gray-700">
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-10px] w-0 h-0 
          border-l-[12px] border-l-transparent 
          border-r-[12px] border-r-transparent 
          border-t-[12px] border-t-white/90 dark:border-t-gray-800/90">
        </div>
        
        {/* 内容区域 */}
        <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">AI</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</span>
              </div>
              <p className="leading-relaxed">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
