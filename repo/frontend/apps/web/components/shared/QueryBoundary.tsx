"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component } from "react";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { isApiError } from "@/lib/web/apiError";
import { reportFailure } from "@/lib/web/errorTracking";
import type {
  QueryBoundaryProps,
  QueryRenderBoundaryProps,
  QueryRenderBoundaryState,
} from "@/types/query/boundaryComponents";

class QueryRenderBoundary extends Component<QueryRenderBoundaryProps, QueryRenderBoundaryState> {
  state: QueryRenderBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): QueryRenderBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
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

  private reset = () => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error && this.props.renderFailure) {
      return this.props.renderFailure({
        error: this.state.error,
        onRetry: this.reset,
        title: this.props.title,
        compact: this.props.compact,
      });
    }
    if (this.state.error)
      return (
        <QueryFailure
          error={this.state.error}
          onRetry={this.reset}
          title={this.props.title}
          compact={this.props.compact}
        />
      );
    return this.props.children;
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
