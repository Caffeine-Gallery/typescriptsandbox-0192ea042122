export const idlFactory = ({ IDL }) => {
  const FileId = IDL.Text;
  const UserId = IDL.Text;
  const Position = IDL.Record({ 'line' : IDL.Nat, 'column' : IDL.Nat });
  const UserPosition = IDL.Record({ 'fileId' : FileId, 'position' : Position });
  return IDL.Service({
    'getCode' : IDL.Func([FileId], [IDL.Opt(IDL.Text)], ['query']),
    'getUserPositions' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(UserId, UserPosition))],
        ['query'],
      ),
    'saveCode' : IDL.Func([FileId, IDL.Text], [], []),
    'updateUserPosition' : IDL.Func([UserId, FileId, IDL.Nat, IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
