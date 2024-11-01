import Hash "mo:base/Hash";

import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";

actor {
  type UserId = Text;
  type FileId = Text;
  type Position = {
    line : Nat;
    column : Nat;
  };
  type UserPosition = {
    fileId : FileId;
    position : Position;
  };

  private stable var nextId : Nat = 0;
  private var codeStore = HashMap.HashMap<FileId, Text>(10, Text.equal, Text.hash);
  private var userPositions = HashMap.HashMap<UserId, UserPosition>(10, Text.equal, Text.hash);

  private stable var stableEntries : [(FileId, Text)] = [];

  public shared(msg) func saveCode(fileId : FileId, code : Text) : async () {
    codeStore.put(fileId, code);
  };

  public query func getCode(fileId : FileId) : async ?Text {
    codeStore.get(fileId)
  };

  public shared(msg) func updateUserPosition(userId : UserId, fileId : FileId, line : Nat, column : Nat) : async () {
    userPositions.put(userId, { fileId = fileId; position = { line = line; column = column } });
  };

  public query func getUserPositions() : async [(UserId, UserPosition)] {
    Iter.toArray(userPositions.entries())
  };

  system func preupgrade() {
    stableEntries := Iter.toArray(codeStore.entries());
  };

  system func postupgrade() {
    codeStore := HashMap.fromIter<FileId, Text>(stableEntries.vals(), 10, Text.equal, Text.hash);
  };
}
