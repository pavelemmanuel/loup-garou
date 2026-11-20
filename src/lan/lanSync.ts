import { MatchState, RoleId } from '../engine/types';

export interface LanRoomMember {
  id: string;
  name: string;
  avatarIndex: number;
  isHost?: boolean;
}

export type LanPacket =
  | {
      type: 'ROOM_STATE';
      roomCode: string;
      hostId: string;
      members: LanRoomMember[];
      match: MatchState | null;
    }
  | {
      type: 'JOIN_ROOM';
      roomCode: string;
      member: LanRoomMember;
    }
  | {
      type: 'PLAYER_NIGHT_ACTION';
      roomCode: string;
      actorId: string;
      action:
        | { kind: 'thief'; cardIndex: 0 | 1 | null }
        | { kind: 'cupid'; loverAId: string; loverBId: string }
        | { kind: 'bodyguard'; targetId: string }
        | { kind: 'raven'; targetId: string | null }
        | { kind: 'seer'; targetId: string }
        | { kind: 'werewolf'; targetId: string }
        | { kind: 'infect_father'; infect: boolean }
        | { kind: 'white_wolf'; targetId: string | null }
        | { kind: 'witch'; useHeal: boolean; poisonTargetId: string | null }
        | { kind: 'hunter'; targetId: string }
        | { kind: 'mayor_successor'; targetId: string };
    }
  | {
      type: 'PLAYER_DAY_VOTE';
      roomCode: string;
      voterId: string;
      targetId: string;
    };

type PacketListener = (packet: LanPacket) => void;

export class LanSyncManager {
  private roomCode: string = '';
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Set<PacketListener> = new Set();

  public connect(roomCode: string, customWsUrl?: string) {
    this.disconnect();
    this.roomCode = roomCode.trim().toUpperCase();

    // 1. Zero-config multi-tab / local browser BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(`loupgarou_room_${this.roomCode}`);
        this.channel.onmessage = (ev) => {
          if (ev.data && ev.data.type && ev.data.roomCode === this.roomCode) {
            this.emit(ev.data as LanPacket);
          }
        };
      } catch {
        // Ignore on runtimes without BroadcastChannel
      }
    }

    // 2. Local Wi-Fi / Hotspot WebSocket Relay (ws://<host>:4567)
    const defaultHost =
      typeof window !== 'undefined' &&
      window.location?.hostname &&
      !window.location.hostname.includes('appassets')
        ? window.location.hostname
        : '127.0.0.1';
    const wsUrl = customWsUrl?.trim() || `ws://${defaultHost}:4567`;

    if (typeof WebSocket !== 'undefined') {
      try {
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          this.ws = socket;
        };
        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(String(event.data)) as LanPacket;
            if (parsed && parsed.roomCode === this.roomCode) {
              this.emit(parsed);
            }
          } catch {
            // Ignore malformed JSON
          }
        };
        socket.onerror = () => {
          // Silent fallback if running offline without external relay
        };
      } catch {
        // Silent fallback
      }
    }
  }

  public send(packet: LanPacket) {
    if (this.channel) {
      try {
        this.channel.postMessage(packet);
      } catch {
        // Ignore
      }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(packet));
      } catch {
        // Ignore
      }
    }
  }

  public subscribe(listener: PacketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(packet: LanPacket) {
    this.listeners.forEach((fn) => fn(packet));
  }

  public disconnect() {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignore
      }
      this.channel = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
  }
}

export const lanSync = new LanSyncManager();
