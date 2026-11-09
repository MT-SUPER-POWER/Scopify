"use client";

import { motion } from "motion/react";
import { LoginBrand } from "./LoginBrand";

// 提取骨架屏组件，保持代码整洁
const LoginSkeletonLoading = () => {
  return (
    <>
      <LoginBrand />

      <motion.div
        className="w-full max-w-sm rounded-3xl border border-content/5 bg-skeleton-subtle p-6"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      >
        {/* 登录方式 tab */}
        <div className="h-10 w-full rounded-xl bg-skeleton" />
        {/* 二维码 + 状态文案 */}
        <div className="mt-5 flex min-h-72 flex-col items-center justify-center">
          <div className="size-48 rounded-2xl bg-skeleton" />
          <div className="mt-5 h-4 w-32 rounded-full bg-skeleton" />
          <div className="mt-2 h-3 w-40 rounded-full bg-skeleton" />
        </div>
        {/* 底部平台行 */}
        <div className="mt-5 flex items-center justify-between border-t border-content/5 pt-3">
          <div className="h-3 w-14 rounded-full bg-skeleton" />
          <div className="h-6 w-32 rounded-full bg-skeleton" />
        </div>
      </motion.div>
    </>
  );
};

export default LoginSkeletonLoading;
