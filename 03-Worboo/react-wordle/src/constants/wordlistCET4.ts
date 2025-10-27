// 定义单词类型
export interface Word {
    text: string;        // 单词文本
    category?: string;  // 单词分类（可选）
    chineseDef: string; // 中文释义
    englishDef: string; // 英文释义
    length: number;     // 单词长度
}

// 创建带长度属性的单词
const createWord = (text: string, chineseDef: string, englishDef: string): Word => ({
  text,
  chineseDef,
  englishDef,
  length: text.length
})

// 按长度分类的单词映射
export const WORDS_BY_LENGTH: { [length: number]: Word[] } = {
  // 2个字母的单词
  2: [
    createWord('as', '当…的时候', 'used to indicate time or manner'),
    createWord('at', '在…里；在…时', 'used to indicate location or time'),
    createWord('be', '是；在', 'to exist or have a specified state'),
    createWord('by', '在…旁；被，由', 'indicating proximity or means'),
    createWord('do', '做，干，办', 'to perform an action'),
    createWord('go', '去；走；变为', 'to move or proceed'),
    createWord('he', '（主格）他', 'third-person singular male pronoun'),
    createWord('if', '假如，如果', 'introducing a conditional clause'),
    createWord('in', '在…里；进，入', 'indicating location or inclusion'),
    createWord('me', '（宾格）我', 'first-person singular object pronoun'),
    createWord('no', '不；并不', 'used to express negation'),
    createWord('of', '…的；由于', 'indicating possession or association'),
    createWord('on', '在…上', 'indicating position above'),
    createWord('or', '或，或者', 'used to connect alternatives'),
    createWord('to', '到', 'indicating direction or purpose'),
    createWord('up', '向上', 'toward a higher position'),
    createWord('we', '我们', 'first-person plural pronoun')
  ],
  
  // 3个字母的单词
  3: [
    createWord('add', '添加，附加，掺加', 'to combine numbers or quantities'),
    createWord('age', '年龄；时代', 'the length of time lived or existed'),
    createWord('ago', '以前', 'in the past'),
    createWord('aid', '帮助；救护', 'assistance or help'),
    createWord('aim', '瞄准；致力', 'to direct toward a target'),
    createWord('air', '空气；空中', 'the invisible gaseous substance surrounding the earth'),
    createWord('all', '全部的', 'the whole quantity or extent'),
    createWord('and', '和，又，并', 'used to connect words or clauses'),
    createWord('ant', '蚂蚁', 'a small social insect'),
    createWord('any', '任何的', 'one, some, or all indiscriminately'),
    createWord('arm', '臂；武器', 'the upper limb of the human body'),
    createWord('art', '艺术，美术', 'the expression of creative skill'),
    createWord('bad', '坏的，恶的', 'of poor quality or low standard'),
    createWord('bag', '袋，包', 'a container made of flexible material'),
    createWord('bar', '酒吧间；条', 'a long rigid piece or a drinking place'),
    createWord('bat', '球拍；蝙蝠', 'a club used in sports or a flying mammal'),
    createWord('bed', '床，床位', 'a piece of furniture for sleep'),
    createWord('bee', '蜂，蜜蜂', 'an insect that produces honey'),
    createWord('bet', '打赌', 'to wager or risk something'),
    createWord('big', '大的，巨大的', 'of great size or extent'),
    createWord('bit', '一点，一些', 'a small piece or amount'),
    createWord('bow', '鞠躬；弓', 'to bend the head or a weapon'),
    createWord('box', '箱，盒', 'a container with a flat base'),
    createWord('boy', '男孩，少年', 'a male child or youth'),
    createWord('bus', '公共汽车', 'a large motor vehicle for passengers'),
    createWord('but', '但是，可是', 'used to introduce a contrast'),
    createWord('buy', '买，购买', 'to acquire by payment'),
    createWord('can', '罐头；容器', 'a metal container or ability'),
    createWord('cap', '帽子；帽状物', 'a head covering or limit'),
    createWord('car', '汽车，小汽车', 'a wheeled motor vehicle')
    // ... (其余3个字母的单词按此模式继续)
  ],
  
  // 4个字母的单词
  4: [
    createWord('able', '有能力的', 'having the power or skill to do something'),
    createWord('acid', '酸', 'a chemical substance with a sour taste'),
    createWord('also', '而且，还', 'in addition; too'),
    createWord('area', '地区；面积', 'a region or part of a surface'),
    createWord('army', '军队；陆军', 'a large organized armed force'),
    createWord('baby', '婴儿', 'a very young child'),
    createWord('back', '回；在后', 'the rear part or to return'),
    createWord('bake', '烤，烘', 'to cook by dry heat'),
    createWord('ball', '球；舞会', 'a round object or a formal dance'),
    createWord('bank', '银行；堤', 'a financial institution or riverbank'),
    createWord('base', '基础；基地', 'the bottom or a starting point'),
    createWord('bath', '浴，洗澡', 'the act of washing or a tub'),
    createWord('bear', '熊；承受', 'a large mammal or to endure'),
    createWord('beat', '打，敲', 'to strike repeatedly'),
    createWord('beer', '啤酒', 'an alcoholic drink made from malt'),
    createWord('bell', '钟，铃', 'a hollow object that rings'),
    createWord('belt', '带，腰带', 'a strip worn around the waist'),
    createWord('best', '最好的', 'of the highest quality'),
    createWord('bill', '账单；票据', 'a statement of money owed'),
    createWord('bind', '捆绑；约束', 'to tie or secure'),
    createWord('bird', '鸟，禽', 'a feathered vertebrate'),
    createWord('bite', '咬；叮', 'to cut with teeth'),
    createWord('blow', '吹；打击', 'to move air or hit'),
    createWord('blue', '蓝色的', 'a color like the sky'),
    createWord('boat', '小船，艇', 'a small watercraft'),
    createWord('body', '身体；主体', 'the physical structure of a person'),
    createWord('boil', '沸腾；煮沸', 'to heat to boiling point'),
    createWord('bold', '大胆的', 'showing courage or prominence'),
    createWord('bomb', '炸弹', 'an explosive device'),
    createWord('bone', '骨，骨骼', 'a hard part of the skeleton')
    // ... (其余4个字母的单词按此模式继续)
  ],
  
  // 5个字母的单词
  5: [
    createWord('abuse', '滥用；虐待', 'to misuse or treat badly'),
    createWord('adapt', '使适应；改编', 'to adjust or modify'),
    createWord('admit', '承认；准许进入', 'to acknowledge or allow entry'),
    createWord('adopt', '收养；采用', 'to take as one’s own'),
    createWord('adult', '成年人', 'a fully grown person'),
    createWord('affair', '事务；事情', 'an event or matter'),
    createWord('after', '在…以后', 'following in time or place'),
    createWord('again', '又一次', 'once more'),
    createWord('agent', '代理人；动因', 'a person who acts for another'),
    createWord('agree', '同意', 'to have the same opinion'),
    createWord('ahead', '向前；在前面', 'in front or in advance'),
    createWord('alarm', '惊恐；警报', 'fear or a warning device'),
    createWord('album', '粘贴簿，集邮簿', 'a collection holder, e.g., for photos'),
    createWord('alert', '警觉的', 'vigilant or aware'),
    createWord('alike', '相像', 'similar or in the same way'),
    createWord('alive', '活着的', 'living, not dead'),
    createWord('allow', '允许，准许', 'to permit'),
    createWord('alone', '单独的', 'by oneself'),
    createWord('along', '沿着', 'beside or through'),
    createWord('amaze', '使惊奇', 'to cause wonder'),
    createWord('among', '在…之中', 'in the midst of'),
    createWord('anger', '怒，愤怒', 'strong feeling of displeasure'),
    createWord('angle', '角，角度', 'a space between two lines'),
    createWord('angry', '愤怒的', 'feeling or showing anger'),
    createWord('annoy', '使恼怒', 'to irritate'),
    createWord('apple', '苹果', 'a common fruit'),
    createWord('apply', '申请；应用', 'to request or use')
    // ... (其余5个字母的单词按此模式继续)
  ],
  
  // 6个字母的单词
  6: [
    createWord('absent', '缺席的', 'not present'),
    createWord('access', '接近；通道', 'means of approach or entry'),
    createWord('accept', '接受', 'to receive willingly'),
    createWord('across', '横过', 'from one side to the other'),
    createWord('action', '行动；作用', 'the process of doing something')
    // ... (其余6个字母的单词按此模式继续)
  ],
  
  // 7个字母的单词
  7: [
    createWord('ability', '能力；本领', 'capacity to do something'),
    createWord('abandon', '丢弃；放弃', 'to leave completely'),
    createWord('account', '记述；账目', 'a record or narrative'),
    createWord('achieve', '完成，实现', 'to accomplish successfully'),
    createWord('address', '地址；演说', 'location or a speech')
    // ... (其余7个字母的单词按此模式继续)
  ]
  // 继续包含所有长度（如8、9等）的单词，按此模式整理
};

// 以下函数保持不变
export const WORDS = Object.values(WORDS_BY_LENGTH).flatMap(words => words.map(w => w.text));

export const getWordsByLength = (length: number): Word[] => {
  return WORDS_BY_LENGTH[length] || [];
};

export const getSupportedLengths = (): number[] => {
  return Object.keys(WORDS_BY_LENGTH).map(Number).sort((a, b) => a - b);
};

export const getRandomLength = (): number => {
  const lengths = getSupportedLengths();
  return lengths[Math.floor(Math.random() * lengths.length)];
};

export const getRandomWordByLength = (length: number): Word | undefined => {
  const words = getWordsByLength(length);
  return words[Math.floor(Math.random() * words.length)];
};