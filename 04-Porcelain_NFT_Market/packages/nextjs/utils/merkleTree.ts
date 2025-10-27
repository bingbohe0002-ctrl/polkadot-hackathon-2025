import { MerkleTree } from 'merkletreejs';
import { soliditySha3 } from "web3-utils";

type AirdropInfo = {
  address: string;
  tokenId: number;
};

export const generateMerkleTree = (airdropList: AirdropInfo[]) => {
  // 将地址和tokenId组合生成叶子节点
  const leaves = airdropList.map(item => 
    soliditySha3(
      { type: 'address', value: item.address },
      { type: 'uint256', value: item.tokenId }
    )
  );

  // 创建默克尔树
  const merkleTree = new MerkleTree(leaves, soliditySha3, { sortPairs: true });
  // 获取根哈希
  const rootHash = merkleTree.getHexRoot();
  
  // 为每个地址生成证明
  const proofs = airdropList.map(item => ({
    address: item.address,
    tokenId: item.tokenId,
    proof: merkleTree.getHexProof(soliditySha3(
      { type: 'address', value: item.address },
      { type: 'uint256', value: item.tokenId }
    ) as string)
  }));

  return {
    root: rootHash,
    proofs,
    tree: merkleTree
  };
};

// 验证地址和tokenId是否在白名单中
export const verifyAddressAndToken = (address: string, tokenId: number, proof: string[], root: string) => {
  const leaf = soliditySha3(
    { type: 'address', value: address },
    { type: 'uint256', value: tokenId }
  );
  return MerkleTree.verify(proof, root, leaf as string, soliditySha3, { sortPairs: true });
}; 