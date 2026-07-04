"use client";

import { motion } from "motion/react";

// 提取骨架屏组件，保持代码整洁
const LoginSkeletonLoading = () => {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      {/* Logo 骨架 */}
      <div className="mb-6 flex flex-col items-center">
        <motion.div
          className="mb-3 h-14 w-14 rounded-2xl bg-zinc-800"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
        <motion.div
          className="h-3 w-24 rounded-full bg-zinc-800/80"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.1 }}
        />
      </div>

      <div className="w-full max-w-[320px]">
        {/* Tabs 切换器骨架 */}
        <motion.div
          className="mb-4 h-10 w-full rounded-xl bg-zinc-900"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        />

        {/* 主体表单/二维码容器骨架 */}
        <motion.div
          className="flex h-75 w-full flex-col items-center justify-center space-y-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.3 }}
        >
          {/* 模拟中间的二维码区域 */}
          <motion.div className="h-40 w-40 rounded-xl bg-zinc-800/80" />
          <motion.div className="mt-2 h-4 w-32 rounded-full bg-zinc-800/80" />
          <motion.div className="h-3 w-40 rounded-full bg-zinc-800/60" />
        </motion.div>

        {/* 底部文案骨架 */}
        <div className="mt-6 flex justify-center">
          <motion.div
            className="h-3 w-48 rounded-full bg-zinc-800/60"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginSkeletonLoading;
