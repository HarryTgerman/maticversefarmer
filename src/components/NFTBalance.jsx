import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Card, Image, Tooltip, Modal, Space, Spin, Button, Typography } from "antd";
import { useNFTBalance } from "hooks/useNFTBalance";
import { UnlockOutlined, LockOutlined, SendOutlined, RollbackOutlined } from "@ant-design/icons";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { getExplorer } from "helpers/networks";
import { useWeb3ExecuteFunction } from "react-moralis";
import contractInfo from "contracts/MaticVerseFarmer.json";
import nftContractInfo from "contracts/Nft.json";
import marketplaceContractInfo from "contracts/marketplace.json";

const { Meta } = Card;

const styles = {
  NFTs: {
    display: "flex",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
    justifyContent: "flex-start",
    margin: "0 auto",
    maxWidth: "1000px",
    gap: "10px",
    marginTop: "50px"
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }
};

const { Title, Text, Link } = Typography


const { contractName, networks, abi } = contractInfo;
const { abi: nftAbi } = nftContractInfo;

const { abi: marketAbi } = marketplaceContractInfo;

const rarity = ["basic", "gold", "blue", "purple", "legendary"], names = ["black phenom", "miss marvelous", "captain matic", "snake eyes", "mysterio", "wings_of_chaos", "trickster", "silver rage", "blue steel", "mischievio", "mr operative", "bugboy", "starboy", "tempestas", "thorgon", "warhammer", "super soldier", "blood beast"], class_mapping = {
  black_phenom: "mystic",
  miss_marvelous: "cosmic",
  captain_matic: "science",
  snake_eyes: "mutant",
  mysterio: "mystic",
  wings_of_chaos: "tech",
  trickster: "skill",
  silver_rage: "science",
  blue_steel: "tech",
  mischievio: "mystic",
  mr_operative: "skill",
  bugboy: "science",
  starboy: "cosmic",
  tempestas: "mutant",
  thorgon: "cosmic",
  warhammer: "tech",
  super_soldier: "skill",
  blood_beast: "mutant"
}

const HeroesComponent = ({ nft, unlockHeroes,
  transferBack }) => {
  const { chainId, farmAddress, fee } = useMoralisDapp();
  const { web3, isWeb3Enabled, Moralis } = useMoralis();

  const [status, setStatus] = useState();

  useEffect(() => {
    if (isWeb3Enabled && nft) {
      getStatus()
    }

  }, [isWeb3Enabled, chainId, nft])

  async function getStatus() {
    const gameC = new web3.eth.Contract(abi, farmAddress)
    const res = await gameC.methods.heroStates(nft.tokenId.toString()).call()
    setStatus(res === "0" ? false : true)
  }

  return (
    <Card
      title={"Heroes in Farmer contract"}
      hoverable
      actions={[
        <Tooltip title="Unlock Hero for autoFight">
          <UnlockOutlined onClick={() => unlockHeroes(nft.tokenId)} />
        </Tooltip>,
        <Tooltip title="Transfer your Hero back">
          <RollbackOutlined onClick={() => transferBack(nft.tokenId)} />
        </Tooltip>,
      ]}
      style={{ width: 240, border: "2px solid #e7eaf3" }}
    >
      <Meta title={nft.name} description={
        <Space direction="vertical"><Text type="primary">ID: {nft.tokenId}</Text><Text type="primary">Rarity: {nft.tier}</Text><Text type="primary">XP: {nft.xp}</Text>
          <Text type={status ? "success" : "danger"}>Status: {status ? "Unlocked" : "Locked"}</Text>

        </Space>} />
    </Card>
  )
}


function NFTBalance() {
  // const { NFTBalance, fetchSuccess } = useNFTBalance();
  const { chainId, marketAddress, contractABI, babyVAddress, walletAddress, setBalance, farmAddress, fee } = useMoralisDapp();
  const { web3, isWeb3Enabled, Moralis } = useMoralis();
  const [visible, setVisibility] = useState(false);
  const [nftToSend, setNftToSend] = useState(null);
  const [price, setPrice] = useState(1);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [heroes, setHeroes] = useState([]);
  const [marketHeroes, setMarketHeroes] = useState([]);

  const [heroesFetched, setHeroesFetched] = useState(false);

  const contractProcessor = useWeb3ExecuteFunction();
  const contractABIJson = JSON.parse(contractABI);
  const listItemFunction = "createMarketItem";
  const ItemImage = Moralis.Object.extend("ItemImages");





  useEffect(() => {
    if (isWeb3Enabled && farmAddress && contractProcessor) {
      getHeroes()
    }

  }, [isWeb3Enabled, farmAddress, chainId])

  useEffect(() => {
    if (isWeb3Enabled && marketAddress && babyVAddress && contractProcessor) {
      getMarketHeroes()
    }

  }, [isWeb3Enabled, marketAddress, babyVAddress, chainId])


  async function getMarketHeroes() {
    if (!isWeb3Enabled || !Moralis) return

    const babyV = new web3.eth.Contract(marketAbi, marketAddress)

    setLoading(true);

    const a = await babyV.methods.fetchInventory(walletAddress).call();

    const e = await fetchMyNFTData(a)

    const json = generateJson(e)


    setMarketHeroes(json.NFTs)

    setLoading(false);

  }

  async function getHeroes() {
    if (!web3 || !Moralis) return
    const options = {
      contractAddress: farmAddress,
      functionName: "playerHeroes",
      abi,
      params: {
        player: walletAddress,
        index: "0"
      }
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: async (result) => {
        const e = await fetchMyNFTData([result.toString()])
        const json = generateJson(e)
        setHeroes(json.NFTs)
        setHeroesFetched(true)
        setLoading(false);
      },
      onError: (error) => {
        setLoading(false);
      },
    });
  }


  async function fetchMyNFTData(e, status) {

    let t, n = new web3.eth.Contract(nftAbi, babyVAddress), a = [];
    for (let i = 0; i < e.length; i++) {
      t = n.methods.nfts((parseInt(e[i]) - 1).toString()).call()
      a.push(t);

    }
    const nfts = Promise.all(a)
    return nfts
  }


  function generateJson(e) {
    for (var t = {
      NFTs: []
    }, n = 0; n < e.length; n++)
      t.NFTs.push({
        name: capitalize(names[parseInt(e[n][0])]),
        key: names[parseInt(e[n][0])],
        // class: class_mapping[names[parseInt(e[n][0])]].toLowerCase(),
        tier: rarity[parseInt(e[n][1])].toLowerCase(),
        price: e[n][5].slice(0, -18),
        tokenId: parseInt(e[n][2]),
        isOnSale: e[n][4],
        xp: e[n][3]
      });
    return t
  }

  function capitalize(e) {
    const t = e.split("_");
    for (var n = 0; n < t.length; n++)
      t[n] = t[n].charAt(0).toUpperCase() + t[n].slice(1);
    return t.join(" ")
  }

  const handleSendClick = (nft) => {
    getApproved(nft);
    setNftToSend(nft);
    setVisibility(true);
  };

  function succList() {
    let secondsToGo = 5;
    const modal = Modal.success({
      title: "Success!",
      content: `Your NFT was listed on the marketplace`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function succApprove() {
    let secondsToGo = 5;
    const modal = Modal.success({
      title: "Success!",
      content: `Approval successful`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function failList() {
    let secondsToGo = 5;
    const modal = Modal.error({
      title: "Error!",
      content: `There was a problem listing your NFT`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function failApprove() {
    let secondsToGo = 5;
    const modal = Modal.error({
      title: "Error!",
      content: `There was a problem with setting approval`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function addItemImage() {
    const itemImage = new ItemImage();

    itemImage.set("image", nftToSend.image);
    itemImage.set("nftContract", nftToSend.token_address);
    itemImage.set("tokenId", nftToSend.token_id);
    itemImage.set("name", nftToSend.name);

    itemImage.save();
  }


  function failSend() {
    let secondsToGo = 5;
    const modal = Modal.error({
      title: "Error!",
      content: `There was a problem with sending your hero`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function succSend() {
    let secondsToGo = 5;
    const modal = Modal.success({
      title: "Success!",
      content: `Hero succesfully send`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  function succUnlock() {
    let secondsToGo = 5;
    const modal = Modal.success({
      title: "Success!",
      content: `Hero succesfully Unlocked`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  async function approve(nft) {
    setLoading(true);
    const ops = {
      contractAddress: babyVAddress,
      functionName: "approve",
      abi: nftAbi,
      params: {
        to: babyVAddress,
        tokenId: nft.tokenId
      },
    };

    await contractProcessor.fetch({
      params: ops,
      onSuccess: () => {
        console.log("Approval Received");
        setLoading(false);
        succApprove();
      },
      onError: (error) => {
        failApprove();
      },
    });
  }

  async function getApproved(nft) {
    setLoading(true);
    const ops = {
      contractAddress: babyVAddress,
      functionName: "getApproved",
      abi: nftAbi,
      params: {
        tokenId: nft.tokenId
      },
    };

    await contractProcessor.fetch({
      params: ops,
      onSuccess: (result) => {
        console.log("Approval Received", result);
        setLoading(false);
        // setVisibility(false);
        if (result) setApproved(true)
      },
      onError: (error) => {
        // setLoading(false);
        failApprove();
      },
    });
  }

  async function send(nft) {
    setLoading(true);
    const ops = {
      contractAddress: babyVAddress,
      functionName: "Gift",
      abi: nftAbi,
      params: {
        _tokenId: nft.tokenId,
        giftTo: farmAddress
      },
    };

    await contractProcessor.fetch({
      params: ops,
      onSuccess: () => {
        setLoading(false);
        setVisibility(false);
        getHeroes();
        getMarketHeroes();
        succSend();
      },
      onError: (error) => {
        setLoading(false);
        failSend();
      },
    });
  }

  async function getStatus(tokenId) {
    let status = 0;
    const options = {
      contractAddress: farmAddress,
      functionName: "heroStates",
      abi,
      params: {
        tokenId
      }
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: (result) => {
        status = result
      },
      onError: (error) => {
        console.log("error", error)
      },
    });
    return status
  }


  async function unlockHeroes(tokenId) {
    const options = {
      contractAddress: farmAddress,
      functionName: "unlockNFT",
      abi,
      params: {
        tokenId
      },
      msgValue: Moralis.Units.ETH(fee),
    };

    await contractProcessor.fetch({
      params: options,
      onSuccess: (result) => {
        console.log("success", result);
        setLoading(false);
        setVisibility(false);
        succUnlock();
        getHeroes();
      },
      onError: (error) => {
        console.log("FAIL", error);
        setLoading(false);
      },
    });
  }

  async function transferBack(tokenId) {
    const options = {
      contractAddress: farmAddress,
      functionName: "transferBack",
      abi,
      params: {
        tokenId
      }
    };

    await contractProcessor.fetch({
      params: options,
      onSuccess: (result) => {
        getHeroes()
        getMarketHeroes()
        succSend()
        setLoading(false);
      },
      onError: (error) => {
        console.log("FAIL", error);
        setLoading(false);
        failSend()
      },
    });
  }


  return (
    <div style={styles.container}>
      <div style={styles.NFTs}>
        {loading && <Spin />}
        {marketHeroes &&
          marketHeroes.map((item, index) => {
            if (!item.tokenId) return
            return (
              <Card
                hoverable
                actions={[
                  <Tooltip title="Send NFT to Farm contract">
                    <SendOutlined onClick={() => handleSendClick(item)} />
                  </Tooltip>,
                ]}
                style={{ width: 240, border: "2px solid #e7eaf3" }}
                key={index}
              >
                <Meta title={item.name} description={
                  <Space direction="vertical"><Text type="primary">ID: {item.tokenId}</Text><Text type="primary">Rarity: {item.tier}</Text><Text type="primary">XP: {item.xp}</Text></Space>} />
              </Card>
            )
          })}
      </div>
      <div style={styles.NFTs}>
        {heroes &&
          heroes.map((nft) => {
            if (!nft.tokenId) return
            return (
              <HeroesComponent key={nft.tokenId} nft={nft} unlockHeroes={unlockHeroes}
                transferBack={transferBack}
              />
            )
          })}

      </div>
      <Modal
        title={`Send Hero #${nftToSend?.tokenId} to MaticVerseFarmer contract `}
        visible={visible}
        onCancel={() => setVisibility(false)}
        okText="List"
        footer={[
          <Button onClick={() => approve(nftToSend)} type="primary" >
            Approve
          </Button>,
          <Button onClick={() => send(nftToSend)} type="primary">
            Send
          </Button>
        ]}
      >
        <Spin spinning={loading}>
          Approve and send NFT to MaticVerseFarmer contract
        </Spin>
      </Modal>
    </div>
  );
}

export default NFTBalance;
