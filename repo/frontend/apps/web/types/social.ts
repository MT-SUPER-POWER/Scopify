import type { NeteaseUser } from "@/types/api/user";
import type { SongDetail } from "@/types/api/music";

export interface SocialUser {
  id: string;
  name: string;
  avatar: string;
  signature: string;
  followed: boolean;
  mutual: boolean;
}
export interface SocialProfile extends SocialUser {
  editable: NeteaseUser;
  cover: string;
  following: number;
  followers: number;
  events: number;
  level?: number;
  listenSongs?: number;
  joinedAt?: number;
}
export type SocialResourceKind = "song" | "playlist" | "album" | "program" | "video";
export interface SocialResource {
  id: string;
  kind: SocialResourceKind;
  name: string;
  subtitle: string;
  cover: string;
  song?: SongDetail;
}
export interface SocialEvent {
  id: string;
  user: SocialUser;
  threadId: string;
  text: string;
  time: number;
  type: number;
  liked: boolean;
  likes: number;
  comments: number;
  forwards: number;
  pictures: string[];
  resource?: SocialResource;
  forward?: SocialEvent;
  unavailableForward: boolean;
  privacy?: number;
}
export interface SocialEventPage {
  items: SocialEvent[];
  next?: number;
}
export interface SocialPeoplePage {
  items: SocialUser[];
  next?: number;
}
export interface SocialPlaylist {
  id: string;
  name: string;
  cover: string;
  count: number;
  creator: string;
}
export interface SocialPlaylistPage {
  items: SocialPlaylist[];
  next?: number;
}
export interface SocialComment {
  id: string;
  user: SocialUser;
  text: string;
  time: number;
  liked: boolean;
  likes: number;
  reply?: { user: SocialUser; text: string };
}
export interface SocialCommentPage {
  items: SocialComment[];
  total: number;
  next?: number;
}
export interface SocialMessage {
  id: string;
  from: SocialUser;
  text: string;
  time: number;
  resource?: SocialResource;
}
export interface SocialMessagePage {
  items: SocialMessage[];
  next?: number;
}
export interface SocialEventTarget {
  id: string;
  uid: string;
  threadId?: string;
}
export interface SocialPublishInput {
  text: string;
  resource?: SocialResource;
}
export interface SocialCommentDraft {
  text: string;
  reply?: string;
}
export interface SocialEventLinkSource {
  id: string;
  user: SocialUser;
  threadId: string;
}
export interface SocialCommentInput {
  threadId: string;
  text?: string;
  commentId?: string;
  operation: "add" | "reply" | "delete";
}
export type SocialPeopleMode = "following" | "followers" | "search";
export type SocialProfileTab = "activity" | "playlists" | "about";
export interface SocialEventPatch {
  id: string;
  patch?: Partial<Pick<SocialEvent, "liked" | "likes" | "comments" | "forwards" | "privacy">>;
  deleted?: boolean;
}
