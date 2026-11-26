import { PostMedia } from "./postMedia";
import { User } from "./user";

export interface LiveStream {
  _id?: string;
  User?: User;
  online?: boolean;
  onlineAt?: string;
  live?: boolean;
  success?: boolean;
  LiveCaptureMedia?: PostMedia[];
  username?: string;
  liveRoomId?: string;
  transmissionType?: string;
  status?: string;
  description?: string;
  endedAt?: string;
  participants?: any;

  peers?: {
    CurrentUser?: any;
    MatchedUser?: any;
    UserTransmitter?: any;
  }

  waiting?: boolean;
  message?: string;

  updateAt?: string;
  createdAt?: string;
}

export interface LiveStreamParticipant {
  _id?: string;
  User?: User;
  liveRoomId?: string;
  status?: string;
  role?: string;
}
