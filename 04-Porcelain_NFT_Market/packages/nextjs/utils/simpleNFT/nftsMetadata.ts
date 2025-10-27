const nftsMetadata = [
  // https://aqua-famous-koala-370.mypinata.cloud/ipfs/QmP3TkeMWefB4W1sZ514GBAMpxxiHstFtYk2q4omeuRJgX
  {
    description: "果宝特攻",
    image: "https://aqua-famous-koala-370.mypinata.cloud/ipfs/QmTeXhVp71hZ1EsjRRLSwSdsEVwbudUUSrUvo36zQiCg5B",
    name: "菠萝吹雪",
    attributes: [
      {
        trait_type: "color",
        value: "yellow",
      }
    ],
  },
  {
    description: "It's actually a bison?",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/buffalo.jpg",
    name: "Buffalo",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "green",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 42,
      },
    ],
  },
  {
    description: "What is it so worried about?",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/zebra.jpg",
    name: "Zebra",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "blue",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 38,
      },
    ],
  },
  {
    description: "What a horn!",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/rhino.jpg",
    name: "Rhino",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "pink",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 22,
      },
    ],
  },
  {
    description: "Is that an underbyte?",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/fish.jpg",
    name: "Fish",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "blue",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 15,
      },
    ],
  },
  {
    description: "So delicate.",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/flamingo.jpg",
    name: "Flamingo",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "black",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 6,
      },
    ],
  },
  {
    description: "Raaaar!",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/godzilla.jpg",
    name: "Godzilla",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "orange",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 99,
      },
    ],
  },
];

export type NFTMetaData = {
  description: string;
  image: string;
  name: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
};

export default nftsMetadata;
