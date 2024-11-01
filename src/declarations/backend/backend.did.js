export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getCode' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ['query']),
    'saveCode' : IDL.Func([IDL.Text], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
