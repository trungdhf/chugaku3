import { type Q, type Subject, pick, mkQ, shuffle } from './types';

const VERBS: [string, string, string, string][] = [
  ['go', 'went', 'gone', '行く'], ['come', 'came', 'come', '来る'], ['eat', 'ate', 'eaten', '食べる'], ['see', 'saw', 'seen', '見る'],
  ['take', 'took', 'taken', '取る'], ['give', 'gave', 'given', '与える'], ['write', 'wrote', 'written', '書く'], ['speak', 'spoke', 'spoken', '話す'],
  ['know', 'knew', 'known', '知っている'], ['make', 'made', 'made', '作る'], ['buy', 'bought', 'bought', '買う'], ['read', 'read', 'read', '読む'],
  ['build', 'built', 'built', '建てる'], ['begin', 'began', 'begun', '始める'], ['break', 'broke', 'broken', '壊す'], ['choose', 'chose', 'chosen', '選ぶ'],
  ['do', 'did', 'done', 'する'], ['drink', 'drank', 'drunk', '飲む'], ['drive', 'drove', 'driven', '運転する'], ['fall', 'fell', 'fallen', '落ちる'],
  ['find', 'found', 'found', '見つける'], ['fly', 'flew', 'flown', '飛ぶ'], ['forget', 'forgot', 'forgotten', '忘れる'], ['get', 'got', 'gotten', '得る'],
  ['grow', 'grew', 'grown', '育てる'], ['have', 'had', 'had', '持っている'], ['hear', 'heard', 'heard', '聞こえる'], ['keep', 'kept', 'kept', '保つ'],
  ['leave', 'left', 'left', '去る'], ['lose', 'lost', 'lost', '失う'], ['meet', 'met', 'met', '会う'], ['put', 'put', 'put', '置く'],
  ['ride', 'rode', 'ridden', '乗る'], ['run', 'ran', 'run', '走る'], ['say', 'said', 'said', '言う'], ['sell', 'sold', 'sold', '売る'],
  ['send', 'sent', 'sent', '送る'], ['sing', 'sang', 'sung', '歌う'], ['sleep', 'slept', 'slept', '眠る'], ['swim', 'swam', 'swum', '泳ぐ'],
  ['teach', 'taught', 'taught', '教える'], ['tell', 'told', 'told', '伝える'], ['think', 'thought', 'thought', '思う'], ['understand', 'understood', 'understood', '理解する'],
  ['wear', 'wore', 'worn', '着ている'], ['win', 'won', 'won', '勝つ'], ['catch', 'caught', 'caught', 'つかまえる'], ['bring', 'brought', 'brought', '持ってくる'],
  ['become', 'became', 'become', '〜になる'], ['be', 'was/were', 'been', '〜である'], ['steal', 'stole', 'stolen', '盗む'], ['show', 'showed', 'shown', '見せる'],
];
const genVerb = (): Q => {
  const [b, p, pp, ja] = pick(VERBS);
  const fake = (s: string) => (s.endsWith('e') ? s + 'd' : s + 'ed');
  if (Math.random() < 0.6)
    return mkQ(`${b}（${ja}）の過去分詞は？`, pp, [p !== pp ? p : fake(b), fake(b), b + 'en', b], `${b} - ${p} - ${pp}`, () => pick(VERBS)[2]);
  return mkQ(`${b}（${ja}）の過去形は？`, p, [pp !== p ? pp : fake(b), fake(b), b + 's'], `${b} - ${p} - ${pp}`, () => pick(VERBS)[1]);
};
const WORDS: [string, string][] = [
  ['environment', '環境'], ['culture', '文化'], ['experience', '経験'], ['foreign', '外国の'], ['important', '重要な'], ['necessary', '必要な'],
  ['difficult', '難しい'], ['popular', '人気のある'], ['famous', '有名な'], ['language', '言語'], ['future', '未来'], ['history', '歴史'],
  ['decide', '決める'], ['believe', '信じる'], ['protect', '守る'], ['invent', '発明する'], ['realize', '気づく・実現する'], ['remember', '覚えている'],
  ['improve', '改善する'], ['solve', '解決する'], ['communicate', '意思を伝え合う'], ['continue', '続ける'], ['explain', '説明する'], ['spread', '広がる'],
  ['peace', '平和'], ['war', '戦争'], ['nature', '自然'], ['energy', 'エネルギー'], ['volunteer', 'ボランティア'], ['society', '社会'],
  ['century', '世紀'], ['government', '政府'], ['opinion', '意見'], ['information', '情報'], ['technology', '科学技術'], ['disaster', '災害'],
  ['without', '〜なしで'], ['through', '〜を通して'], ['during', '〜の間（ずっと）'], ['among', '（3つ以上）の間で'], ['already', 'すでに'], ['yet', '（疑問文で）もう／（否定文で）まだ'],
  ['ever', '今までに'], ['never', '一度も〜ない'], ['since', '〜以来'], ['until', '〜まで（ずっと）'], ['though', '〜だけれども'], ['abroad', '外国へ'],
  ['each other', 'お互い'], ['be proud of', '〜を誇りに思う'], ['be able to', '〜することができる'], ['look forward to', '〜を楽しみに待つ'], ['take care of', '〜の世話をする'], ['give up', 'あきらめる'],
];
const genWord = (): Q => {
  const [en, ja] = pick(WORDS);
  const others = shuffle(WORDS.filter(w => w[0] !== en)).slice(0, 3);
  return Math.random() < 0.5
    ? mkQ(`「${en}」の意味は？`, ja, others.map(o => o[1]))
    : mkQ(`「${ja}」を英語で言うと？`, en, others.map(o => o[0]));
};

export const english: Subject = {
  id: 'eng', name: '英語', short: '英', icon: '🔤', color: '#ef4444',
  units: [
    {
      id: 'e-pp', title: '現在完了・現在完了進行形', tag: '中3', speak: true,
      lesson: `## 形：have / has + 過去分詞
| 用法 | よく使う語 | 例 |
| 継続 | for 〜, since 〜, How long | I have lived here for ten years. |
| 経験 | ever, never, before, 〜 times | I have visited Kyoto twice. |
| 完了 | just, already, yet | I have just finished my homework. |
## 疑問文・否定文
- Have you ever seen it? — Yes, I have. / No, I haven't.
- I have not finished it yet.（否定文の yet = まだ）
> for + 期間（for three years）、since + 始まった時（since 2020）
! 現在完了は yesterday, last week, 〜 ago などの「過去の時を表す語」といっしょに使えない
## 現在完了進行形 have been + 〜ing
- 動作がずっと続いている：I have been studying for two hours.
- have been to 〜 = 〜へ行ったことがある`,
      qs: [
        ['I have lived in Osaka (　) 2015.', 'since', 'for|from|ago', 'since + 始まった時'],
        ['She has been sick (　) three days.', 'for', 'since|during|ago', 'for + 期間'],
        ['Have you (　) been to Hokkaido?', 'ever', 'never|yet|just', '経験をたずねる ever'],
        ['I have (　) finished lunch.（ちょうど）', 'just', 'yet|ever|since', ''],
        ['Has he finished his homework (　)?', 'yet', 'already|just|ever', '疑問文の yet = もう'],
        ['(　) long have you known Ken?', 'How', 'What|When|Which', 'How long 〜？ = どのくらいの間'],
        ['I have (　) Tokyo Skytree three times.', 'visited', 'visit|visiting|visits', 'have + 過去分詞'],
        ['We have (　) friends for ten years.', 'been', 'be|was|were', 'be の過去分詞は been'],
        ['正しい文はどれ？', 'I have seen the movie before.', 'I have seen the movie yesterday.|I have see the movie.|I seen the movie before.', 'yesterday は現在完了と使えない'],
        ['He has been (　) TV since this morning.', 'watching', 'watched|watch|watches', '現在完了進行形 have been + ing'],
        ['Have you ever eaten natto? — No, I (　).', "haven't", "didn't|don't|wasn't", ''],
        ['「私は一度も沖縄に行ったことがない」 I have (　) been to Okinawa.', 'never', 'ever|not yet|already', ''],
      ],
    },
    {
      id: 'e-passive', title: '受け身（受動態）', tag: '中3', speak: true,
      lesson: `## 形：be動詞 + 過去分詞（〜される・〜されている）
- This room is cleaned every day.
- This book was written by Soseki.（by 〜 = 〜によって）
## 疑問文・否定文
- Is English spoken in Canada? — Yes, it is.
- The car was not made in Japan.
> be動詞は主語と時（現在・過去）で決まる
## よく出る表現
- be known to 〜（〜に知られている）, be covered with 〜（〜でおおわれている）
- be made of 〜（材料）, be made from 〜（原料）, be interested in 〜, be surprised at 〜`,
      qs: [
        ['English is (　) in many countries.', 'spoken', 'speak|spoke|speaking', ''],
        ['This temple (　) built 500 years ago.', 'was', 'is|were|has', '主語は単数、過去'],
        ['These pictures were taken (　) my father.', 'by', 'for|with|of', ''],
        ['The mountain is covered (　) snow.', 'with', 'by|of|in', 'be covered with'],
        ['The singer is known (　) everyone in Japan.', 'to', 'by|for|at', 'be known to'],
        ['This desk is made (　) wood.（見て材料がわかる）', 'of', 'from|by|in', '材料は of、原料（形が変わる）は from'],
        ['(　) this letter written in English?', 'Is', 'Does|Do|Has', ''],
        ['Many stars can (　) seen from here.', 'be', 'is|are|been', '助動詞 + be + 過去分詞'],
        ['「その窓はだれに割られたのですか」 Who was the window (　) by?', 'broken', 'broke|break|breaking', ''],
        ['I was surprised (　) the news.', 'at', 'with|of|to', ''],
      ],
    },
    {
      id: 'e-inf', title: '不定詞の発展・SVOC', tag: '中3', speak: true,
      lesson: `## It is 〜 (for 人) to ...
- It is important for us to study English.（私たちにとって英語を勉強することは大切だ）
## want / ask / tell + 人 + to ...
- I want you to come.（あなたに来てほしい）
- My mother told me to clean my room.
## 疑問詞 + to ...
- how to 〜（〜のしかた）, what to 〜, where to 〜, when to 〜
## too 〜 to ... / 〜 enough to ...
- I was too tired to walk.（疲れすぎて歩けなかった）
## SVOC・原形不定詞
- call A B（AをBと呼ぶ）, make A B（AをBにする）：The news made me happy.
- let / help / make + 人 + 動詞の原形：Let me try. / I helped him carry the box.`,
      qs: [
        ['It is difficult (　) me to answer the question.', 'for', 'to|of|with', 'It is 〜 for 人 to ...'],
        ['I want (　) to help me.', 'you', 'your|yours|you are', 'want + 人 + to'],
        ['Do you know how (　) use this machine?', 'to', 'for|can|ing', 'how to 〜'],
        ['My father told me (　) the dishes.', 'to wash', 'wash|washing|washed', ''],
        ['The song made (　) happy.', 'me', 'my|I|mine', 'make A B'],
        ['We call the dog (　).', 'Pochi', 'for Pochi|to Pochi|Pochi is', 'call A B'],
        ['Let me (　) you.', 'help', 'to help|helping|helped', 'let + 人 + 原形'],
        ['This tea is too hot (　) drink.', 'to', 'for|that|so', 'too 〜 to ...'],
        ['I don\'t know what (　) next.', 'to do', 'doing|do|done', ''],
        ['She helped me (　) my homework.', 'do', 'to doing|did|done', 'help + 人 + 原形'],
      ],
    },
    {
      id: 'e-part', title: '分詞の後置修飾', tag: '2学期', speak: true,
      lesson: `## 名詞を後ろから説明する分詞
| 形 | 意味 | 例 |
| 名詞 + 〜ing ... | 〜している（名詞） | the boy playing tennis（テニスをしている少年） |
| 名詞 + 過去分詞 ... | 〜された（名詞） | a car made in Japan（日本で作られた車） |
> 「する側」なら ing、「される側」なら過去分詞
- 分詞1語だけなら前から：a sleeping baby, a broken window
- 2語以上のまとまりは後ろから：the girl standing by the door
## 文の中での位置
- The boy playing tennis is my brother.（主語が長くなる → 動詞は is）`,
      qs: [
        ['The boy (　) soccer over there is Ken.', 'playing', 'played|plays|play', 'サッカーを「している」少年'],
        ['This is a picture (　) by my sister.', 'painted', 'painting|paint|paints', '姉によって「描かれた」絵'],
        ['I have a friend (　) in America.', 'living', 'lived|lives|live', ''],
        ['Look at the (　) window.', 'broken', 'breaking|broke|break', '割られた窓'],
        ['The language (　) in Brazil is Portuguese.', 'spoken', 'speaking|speaks|spoke', ''],
        ['The girl (　) with Mr. Sato is my sister.', 'talking', 'talked|talks|talk', ''],
        ['「これは日本で作られたカメラです」として正しいのは？', 'This is a camera made in Japan.', 'This is a made camera in Japan.|This is a camera making in Japan.|This is a camera is made in Japan.'],
        ['The man (　) a hat is my uncle.', 'wearing', 'worn|wears|wore', ''],
        ['I read a book (　) in easy English.', 'written', 'writing|wrote|writes', ''],
        ['The children running in the park (　) my students.', 'are', 'is|be|was', '主語は The children（複数）'],
      ],
    },
    {
      id: 'e-rel', title: '関係代名詞', tag: '2学期', speak: true,
      lesson: `## 関係代名詞の選び方
| 先行詞 | 主格（後ろが動詞） | 目的格（後ろが主語+動詞） |
| 人 | who / that | that（省略できる） |
| もの・動物 | which / that | which / that（省略できる） |
## 主格
- I have a friend who lives in Kyoto.（京都に住んでいる友達）
- This is a bus which goes to the station.
## 目的格
- This is the book (which) I bought yesterday.（私が昨日買った本）
- The man (that) I met was kind.
> 後ろに「主語 + 動詞」が続けば目的格 → 省略OK
! 先行詞が三人称単数なら、主格のあとの動詞に s：a friend who lives`,
      qs: [
        ['I have a friend (　) can speak French.', 'who', 'which|whose|what', '先行詞が人・主格'],
        ['This is the dog (　) has long ears.', 'which', 'who|whom|what', '先行詞が動物'],
        ['The cake (　) my mother made was delicious.', 'that', 'who|what|whose', '目的格（which でも可）'],
        ['He is a doctor who (　) in this hospital.', 'works', 'work|working|to work', '先行詞 a doctor は三人称単数'],
        ['関係代名詞が省略できる文は？', 'This is the bag that I bought.', 'I know a girl who plays the piano.|This is a train that goes to Nara.|He has a cat which is white.', '目的格（後ろが主語+動詞）は省略できる'],
        ['The man (　) I saw yesterday was a famous actor.', 'that', 'which|what|whose', '人・目的格は that（who も使われる）'],
        ['Kyoto is a city (　) many people visit.', 'which', 'who|where it|what', ''],
        ['「これは私が先週読んだ本です」 This is the book (　).', 'I read last week', 'read I last week|which I read it last week|I read it last week', '目的格のあとに it は不要'],
        ['The students (　) are studying in the library are quiet.', 'who', 'which|whose|they', ''],
        ['Do you know the boy (　) is singing?', 'that', 'which|whom|what', 'who でも可'],
      ],
    },
    {
      id: 'e-subj', title: '仮定法・間接疑問', tag: '2学期', speak: true,
      lesson: `## 仮定法（現実とちがうこと）
- I wish I were a bird.（鳥だったらいいのに）
- I wish I could play the piano.（ピアノがひけたらなあ）
- If I had time, I would go.（もし時間があれば行くのに）
- If I were you, I would ask him.（私があなたなら）
> 仮定法は「過去形」を使うが意味は「今」。be動詞は主語に関係なく were
## 間接疑問（疑問詞 + 主語 + 動詞）
- Where does he live? → I know where he lives.
- What is this? → Do you know what this is?
! 間接疑問では do / does / did を使わず、普通の語順にする`,
      qs: [
        ['I wish I (　) a car.', 'had', 'have|has|will have', '仮定法は過去形'],
        ['If I (　) you, I would study harder.', 'were', 'am|is|be', '仮定法の be動詞は were'],
        ['If I had wings, I (　) fly to you.', 'could', 'can|will|am', ''],
        ['I wish I (　) speak English well.', 'could', 'can|will|am', ''],
        ['Do you know where (　)?', 'he lives', 'does he live|he live|lives he', '間接疑問は 主語+動詞'],
        ['I don\'t know what (　).', 'this is', 'is this|does this|this does', ''],
        ['Tell me when (　) home.', 'you came', 'did you come|came you|you did came', ''],
        ['「もし雨でなければ泳ぎに行くのに」 If it (　) raining, I would go swimming.', "weren't", "isn't|doesn't|won't", ''],
        ['Can you tell me (　) the station is?', 'where', 'how to|what does|which do'],
        ['正しい文はどれ？', 'I wish it were sunny today.', 'I wish it is sunny today.|I wish it will be sunny today.|I wish it be sunny today.'],
      ],
    },
    {
      id: 'e-verbs', title: '不規則動詞（過去形・過去分詞）', tag: '基礎',
      lesson: `## 現在完了・受け身・分詞で必ず使う！
| 原形 | 過去形 | 過去分詞 |
${VERBS.map(v => `| ${v[0]}（${v[3]}） | ${v[1]} | ${v[2]} |`).join('\n')}
> A-B-C型（go-went-gone）、A-B-B型（make-made-made）、A-B-A型（come-came-come）、A-A-A型（put-put-put）に分けて覚えよう`,
      gens: [genVerb],
    },
    {
      id: 'e-words', title: '中3 重要単語・熟語', tag: '基礎', speak: true,
      lesson: `## 単語リスト
| 英語 | 意味 |
${WORDS.map(w => `| ${w[0]} | ${w[1]} |`).join('\n')}
> 声に出して読む → 意味を隠して言えるかチェック`,
      gens: [genWord],
    },
  ],
};
