import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Redirect,
} from "react-router-dom";
import Account from "components/Account";
import Chains from "components/Chains";
import NFTBalance from "components/NFTBalance";
import ERC20Balance from "components/ERC20Balance";
import { Button, Layout, Image, Spin, Typography } from "antd";
import SearchCollections from "components/SearchCollections";
import "antd/dist/antd.css";
import NativeBalance from "components/NativeBalance";
import GameBalance from "components/GameBalance";
import "./style.css";
import Text from "antd/lib/typography/Text";
import NFTMarketTransactions from "components/NFTMarketTransactions";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import contractInfo from "contracts/MaticVerseFarmer.json";
import contractToken from "contracts/MATICVERSE.json";
import { useNativeBalance } from "hooks/useNativeBalance";
import { useERC20Balance } from "hooks/useERC20Balance";


import { useWeb3ExecuteFunction } from "react-moralis";

const { Header, Footer } = Layout;

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "130px",
    padding: "10px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
};
const { abi } = contractInfo
const { abi: tokenAbi } = contractToken



const App = ({ isServerInfo }) => {
  const { balance, nativeName } = useNativeBalance();

  const { isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading, Moralis, web3 } =
    useMoralis();

  const [loading, setLoading] = useState(false);


  const { chainId, farmAddress, setFarmedBalance, tokenBalance, setTokenBalance, walletAddress, fee, setFee, setBabyVAddres,
    setFarmAddress, setTokenAddress, tokenAddress, setMarketAddress } = useMoralisDapp();

  const contractProcessor = useWeb3ExecuteFunction();

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (chainId === "0x89") {
      setBabyVAddres("0xa4d780f0c4ceb3787291894821516d55337a9768")
      // setFarmAddress("0x58305A02CdeDf84448bEf9F8d762d4D67697B815")
      setFarmAddress("0xc253Be29491DD596797C1a5c8141d1C330478f85")
      setTokenAddress("0xfeb090fcd433de479396e82db8b83a470dbad3c9")
      setMarketAddress("0xA4D780f0c4CeB3787291894821516D55337a9768")
    }
    else if (chainId === "0x38") {
      setBabyVAddres("0x47d1f30DDb727360ae623ECFDcfa4Dd167B7f2D4")
      setFarmAddress("0x5D41545c190637b9337Ec5FfA89bAC5ee0CB3a4C")
      setTokenAddress("0xaf7bfa6240745fd41d1ed4b5fade9dcaf369ba6c")
      setMarketAddress("0x47d1f30DDb727360ae623ECFDcfa4Dd167B7f2D4")
    }
  }, [chainId])


  useEffect(() => {
    if (farmAddress && isWeb3Enabled) {
      getFarmedBalance()
      getFee()
    }
  }, [farmAddress, chainId, isWeb3Enabled])

  useEffect(() => {
    if (tokenAddress && isWeb3Enabled) {
      getTokenBalance()
    }
  }, [tokenAddress, chainId, isWeb3Enabled])


  async function claimRewards() {
    if (!isWeb3Enabled) return
    const options = {
      contractAddress: farmAddress,
      functionName: "claimRewards",
      abi,
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: async (result) => {
        await getFarmedBalance()
      },
      onError: (error) => {
        console.log("FAIL", error);
        setLoading(false);
      },
    });

    setLoading(false);
  }

  async function getFarmedBalance() {
    const options = {
      contractAddress: farmAddress,
      functionName: "balances",
      abi,
      params: {
        tokenId: walletAddress
      }
    };

    await contractProcessor.fetch({
      params: options,
      onSuccess: (result) => {
        console.log("success", result);
        setLoading(false);
        setFarmedBalance(Moralis.Units.FromWei(result).toFixed(2))
      },
      onError: (error) => {
        console.log("FAIL", error);
        setLoading(false);
      },
    });
  }

  async function getFee() {
    const options = {
      contractAddress: farmAddress,
      functionName: "fee",
      abi,
    };

    await contractProcessor.fetch({
      params: options,
      onSuccess: (result) => {
        setLoading(false);
        setFee(Moralis.Units.FromWei(result).toFixed(4))
      },
      onError: (error) => {
        console.log("FAIL", error);
        setLoading(false);
      },
    });
  }

  async function getTokenBalance() {
    if (!web3 || !Moralis) return
    const tokenC = new web3.eth.Contract(tokenAbi, tokenAddress)
    const res = await tokenC.methods.balanceOf(walletAddress).call()
    setTokenBalance(Moralis.Units.FromWei(res).toFixed(2))
  }

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);


  return (
    <Layout style={{ height: "100vh", overflow: "auto" }}>
      <Header style={styles.header}>
        <div style={styles.headerRight}>
          <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>MaitcVerse Farmer</div>
        </div>

        <div style={styles.headerRight}>
          <Button onClick={() => navigator.clipboard.writeText(farmAddress)} >Copy Contract</Button>
          <Button href="https://app.gelato.network/new-task" target="_blank">Create Task</Button>
          <Button type="primary" onClick={() => claimRewards()} loading={loading}>Claim</Button>
          {fee ? <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>{`Unlock Fee: ${fee ? fee : "0"} ${nativeName} `}</div> : <Spin />}
          {tokenBalance ? <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>{`${tokenBalance ? tokenBalance : "0"} Mverse`}</div> : <Spin />}
          <GameBalance nativeName={"Farmed Mverse"} />
          <NativeBalance />
          <Chains />
          <Account />
        </div>
      </Header>
      <div style={styles.content}>
        <NFTBalance />
      </div>
      <Footer style={{ textAlign: "center" }}>
        <Text style={{ display: "block" }}>
          Join our{" "}
          <a
            href="https://t.me/maticversefarmer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram group
          </a>
          {" "} if you want:
        </Text>
        <Text style={{ display: "block" }}>
          ⭐️ one free hero unlock
        </Text>
        <Text style={{ display: "block" }}>
          ⭐️ support with setting ub autoFight
        </Text>
        <Text style={{ display: "block" }}>
          ⭐️ free unlock for every reffered MaticVerse Player
        </Text>
      </Footer>
    </Layout>
  );
};

export const Logo = () => (
  <div style={{ display: "flex" }}>
    <Image
      src="logo.png"
      alt=""
      height={60}
    />

  </div>
);

export default App;
