import request from "../web/request";

/**
 * 搜索建议
 * @return res.data.showKeyword
 */
export async function searchDefault(): Promise<string> {
  try {
    const res = await request.get("/search/default");
    const keyword = res.data.data.showKeyword;
    console.log("搜索建议", keyword);
    return keyword;
  } catch (error) {
    console.error("获取搜索建议失败:", error);
    return "";
  }
}

/**
 * 搜索热词
 */
export function searchHot() {
  return request.get("/search/hot");
}
