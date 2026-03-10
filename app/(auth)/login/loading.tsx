"use client";

import { motion } from "motion/react";

// 提取骨架屏组件，保持代码整洁
const LoginSkeletonLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-black p-4 min-h-screen w-screen overflow-hidden">
      {/* Logo 骨架 */}
      <div className="mb-6 flex flex-col items-center">
        <motion.div
          className="w-14 h-14 bg-zinc-800 rounded-2xl mb-3"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
        <motion.div
          className="w-24 h-3 bg-zinc-800/80 rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.1 }}
        />
      </div>

      <div className="w-full max-w-[320px]">
        {/* Tabs 切换器骨架 */}
        <motion.div
          className="w-full h-10 bg-zinc-900 rounded-xl mb-4"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        />

        {/* 主体表单/二维码容器骨架 */}
        <motion.div
          className="w-full h-75 bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.3 }}
        >
          {/* 模拟中间的二维码区域 */}
          <motion.div className="w-40 h-40 bg-zinc-800/80 rounded-xl" />
          <motion.div className="w-32 h-4 bg-zinc-800/80 rounded-full mt-2" />
          <motion.div className="w-40 h-3 bg-zinc-800/60 rounded-full" />
        </motion.div>

        {/* 底部文案骨架 */}
        <div className="mt-6 flex justify-center">
          <motion.div
            className="w-48 h-3 bg-zinc-800/60 rounded-full"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginSkeletonLoading;
