import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type FileId = string;
export interface Position { 'line' : bigint, 'column' : bigint }
export type UserId = string;
export interface UserPosition { 'fileId' : FileId, 'position' : Position }
export interface _SERVICE {
  'getCode' : ActorMethod<[FileId], [] | [string]>,
  'getUserPositions' : ActorMethod<[], Array<[UserId, UserPosition]>>,
  'saveCode' : ActorMethod<[FileId, string], undefined>,
  'updateUserPosition' : ActorMethod<
    [UserId, FileId, bigint, bigint],
    undefined
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
