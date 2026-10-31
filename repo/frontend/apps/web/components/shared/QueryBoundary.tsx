"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component } from "react";
import { QueryConnectionWait } from "@/components/shared/QueryConnectionWait";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { isConnectivityFailure } from "@/lib/query/errorPolicy";
import { queryRecovery } from "@/lib/query/recovery";
import { isApiError } from "@/lib/web/apiError";
import { reportFailure } from "@/lib/web/errorTracking";
import type {
  QueryBoundaryProps,
  QueryRenderBoundaryProps,
  QueryRenderBoundaryState,
} from "@/types/query/boundaryComponents";

class QueryRenderBoundary extends Component<QueryRenderBoundaryProps, QueryRenderBoundaryState> {
  state: QueryRenderBoundaryState = { error: null };
  private unregisterRecovery: (() => void) | null = null;

  static getDerivedStateFromError(error: Error): QueryRenderBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.syncRecovery();
    // API 错误已经由请求层与 QueryCache 记录；这里只记录未预期的渲染异常。
    if (!isApiError(error))
      reportFailure({
        error,
        event: "query.render_failed",
        message: "Query region render failed",
        source: "runtime",
        context: { resetKey: this.props.resetKey },
      });
  }

  componentDidMount() {
    this.syncRecovery();
  }

  componentDidUpdate() {
    this.syncRecovery();
  }

  componentWillUnmount() {
    this.unregisterRecovery?.();
    this.unregisterRecovery = null;
  }

  /** 连接失败交给全局恢复：区域只等待，由横条统一提示与重连。 */
  private syncRecovery() {
    if (this.state.error && isConnectivityFailure(this.state.error)) {
      this.unregisterRecovery ??= queryRecovery.register(this.reset);
    } else {
      this.unregisterRecovery?.();
      this.unregisterRecovery = null;
    }
  }

  private reset = () => {
    this.unregisterRecovery?.();
    this.unregisterRecovery = null;
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (isConnectivityFailure(error))
      return this.props.renderWaiting ? (
        this.props.renderWaiting()
      ) : (
        <QueryConnectionWait title={this.props.title} compact={this.props.compact} />
      );
    const failureProps = {
      error,
      onRetry: this.reset,
      title: this.props.title,
      compact: this.props.compact,
    };
    return this.props.renderFailure ? (
      this.props.renderFailure(failureProps)
    ) : (
      <QueryFailure {...failureProps} />
    );
  }
}

/** 每个实例只恢复自己的 Query 区域；资源 key 改变时重建错误边界。 */
export function QueryBoundary({ resetKey, ...props }: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary key={resetKey}>
      {({ reset }) => <QueryRenderBoundary {...props} resetKey={resetKey} onReset={reset} />}
    </QueryErrorResetBoundary>
  );
}
