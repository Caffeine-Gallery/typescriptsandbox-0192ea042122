import Array "mo:base/Array";
import Hash "mo:base/Hash";

import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";

actor {
  var nextId : Nat = 0;
  let codeStore = HashMap.HashMap<Nat, Text>(10, Nat.equal, Nat.hash);
  stable var stableEntries : [(Nat, Text)] = [];

  public func saveCode(code : Text) : async Nat {
    let id = nextId;
    codeStore.put(id, code);
    nextId += 1;
    id
  };

  public query func getCode(id : Nat) : async ?Text {
    codeStore.get(id)
  };

  system func preupgrade() {
    stableEntries := Iter.toArray(codeStore.entries());
  };

  system func postupgrade() {
    for ((k, v) in stableEntries.vals()) {
      codeStore.put(k, v);
    };
    // Update nextId to be the highest ID + 1
    var maxId : Nat = 0;
    for ((id, _) in stableEntries.vals()) {
      if (id >= maxId) {
        maxId := id;
      };
    };
    nextId := maxId + 1;
  };
}
