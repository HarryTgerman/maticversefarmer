import { useNativeBalance } from "hooks/useNativeBalance";
import { n4 } from "helpers/formatters";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";

function GameBalance(props) {
  const { balance } = useMoralisDapp();

  return (
    <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>{`${balance ? balance : "0"} ${props.nativeName}`}</div>
  );
}

export default GameBalance;
