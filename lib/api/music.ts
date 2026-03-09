import request from "../web/request";

export interface SongUrlMatchResponse {
    code: number;
    data: string;
    proxyUrl: string;
}

export async function greySongUrlMatch(
    id: number | string,
    source?: string
): Promise<SongUrlMatchResponse> {
    const params: Record<string, any> = { id };
    if (source) params.source = source;

    const response = await request.get<SongUrlMatchResponse>('/song/url/match', { params });
    return response.data;
}
