/* Year 8 Web Design: vocabulary bank, split into chunks for learning.

   From "Year 8 Web Design Vocabulary Bank". Changes for the game:
   - Opposite pairs are split into two words (top / bottom → top, bottom), each with its own meaning.
   - A few meanings are reworded so they don't contain the answer (colour, about, visual identity,
     sans-serif, whitespace, homepage hero, user experience, responsive design).

   Word: { id, w: word as shown, d: meaning, zh: Chinese, g: chunk id, alt: extra typed answers }
   Words written "a / b" accept either part when typed.
   Never change an id once students have played: progress is saved against it.
   Chinese drafted by Claude: please have it checked. */
window.WD = {

  LEVELS: {
    "1": { name: "Foundation", zh: "基础" },
    "2": { name: "Core", zh: "核心" },
    "3": { name: "Stretch", zh: "拓展" }
  },

  /* Chunks, in teaching order. Big sections are split into parts. */
  GROUPS: [
    { id: "l1-basic", lv: "1", name: "Basic website vocabulary", zh: "网站基础词汇" },
    { id: "l1-parts", lv: "1", name: "Parts of a page", zh: "页面组成部分" },
    { id: "l1-identity", lv: "1", name: "Identity and work", zh: "身份与作品" },
    { id: "l1-nav", lv: "1", name: "Navigation", zh: "导航" },
    { id: "l1-sections", lv: "1", name: "Common sections", zh: "常见板块" },
    { id: "l1-visitors", lv: "1", name: "Visitors and purpose", zh: "访客与目的" },
    { id: "l1-actions1", lv: "1", name: "Actions", part: 1, zh: "操作动作" },
    { id: "l1-actions2", lv: "1", name: "Actions", part: 2, zh: "操作动作" },
    { id: "l1-position1", lv: "1", name: "Position", part: 1, zh: "位置" },
    { id: "l1-position2", lv: "1", name: "Position", part: 2, zh: "位置" },
    { id: "l1-size", lv: "1", name: "Size and spacing", zh: "大小与间距" },
    { id: "l1-colour", lv: "1", name: "Colour and lettering", zh: "颜色与文字" },
    { id: "l1-organisation", lv: "1", name: "Organisation", zh: "排列与组织" },
    { id: "l1-desc1", lv: "1", name: "Useful descriptions", part: 1, zh: "常用描述词" },
    { id: "l1-desc2", lv: "1", name: "Useful descriptions", part: 2, zh: "常用描述词" },
    { id: "l1-choice", lv: "1", name: "Explaining a choice", zh: "解释选择" },

    { id: "l2-design1", lv: "2", name: "Design and identity", part: 1, zh: "设计与形象" },
    { id: "l2-design2", lv: "2", name: "Design and identity", part: 2, zh: "设计与形象" },
    { id: "l2-audience1", lv: "2", name: "Audience experience and effect", part: 1, zh: "受众体验与效果" },
    { id: "l2-audience2", lv: "2", name: "Audience experience and effect", part: 2, zh: "受众体验与效果" },
    { id: "l2-explain", lv: "2", name: "Explaining design choices", zh: "解释设计选择" },
    { id: "l2-impression1", lv: "2", name: "Describing the impression created", part: 1, zh: "描述给人的印象" },
    { id: "l2-impression2", lv: "2", name: "Describing the impression created", part: 2, zh: "描述给人的印象" },
    { id: "l2-impression3", lv: "2", name: "Describing the impression created", part: 3, zh: "描述给人的印象" },

    { id: "l3-analysis", lv: "3", name: "Analysis and intention", zh: "分析与意图" },
    { id: "l3-usability1", lv: "3", name: "Visual design and usability", part: 1, zh: "视觉设计与易用性" },
    { id: "l3-usability2", lv: "3", name: "Visual design and usability", part: 2, zh: "视觉设计与易用性" },
    { id: "l3-usability3", lv: "3", name: "Visual design and usability", part: 3, zh: "视觉设计与易用性" },
    { id: "l3-technical", lv: "3", name: "Interaction and technical choices", zh: "交互与技术选择" },
    { id: "l3-prompting1", lv: "3", name: "Prompting and development", part: 1, zh: "提示词与开发" },
    { id: "l3-prompting2", lv: "3", name: "Prompting and development", part: 2, zh: "提示词与开发" }
  ],

  WORDS: [
    /* ---------------- Level 1 Foundation */
    { id: "website", g: "l1-basic", w: "website", d: "A collection of connected webpages.", zh: "网站" },
    { id: "webpage", g: "l1-basic", w: "webpage", d: "One page within a website.", zh: "网页" },
    { id: "homepage", g: "l1-basic", w: "homepage", d: "The main introductory page.", zh: "首页；主页" },
    { id: "section", g: "l1-basic", w: "section", d: "One part of a page.", zh: "板块；部分" },
    { id: "content", g: "l1-basic", w: "content", d: "The information, images and other material on a site.", zh: "内容" },

    { id: "heading", g: "l1-parts", w: "heading", d: "A title introducing content.", zh: "标题" },
    { id: "subheading", g: "l1-parts", w: "subheading", d: "A smaller heading.", zh: "小标题；副标题" },
    { id: "paragraph", g: "l1-parts", w: "paragraph", d: "A group of connected sentences.", zh: "段落" },
    { id: "image", g: "l1-parts", w: "image", d: "A picture.", zh: "图片；图像", alt: ["picture"] },
    { id: "caption", g: "l1-parts", w: "caption", d: "Words explaining an image.", zh: "图片说明" },
    { id: "background", g: "l1-parts", w: "background", d: "The area behind the content.", zh: "背景" },

    { id: "name", g: "l1-identity", w: "name", d: "What the person or organisation is called.", zh: "名称；名字" },
    { id: "logo", g: "l1-identity", w: "logo", d: "A visual mark identifying a person or organisation.", zh: "标志（logo）" },
    { id: "portfolio", g: "l1-identity", w: "portfolio", d: "A collection showing someone's work.", zh: "作品集" },
    { id: "project", g: "l1-identity", w: "project", d: "A piece of work.", zh: "项目；作品" },
    { id: "gallery", g: "l1-identity", w: "gallery", d: "A collection of images or projects.", zh: "作品展示区；图库" },

    { id: "menu", g: "l1-nav", w: "menu", d: "A list of choices or destinations.", zh: "菜单" },
    { id: "navigation", g: "l1-nav", w: "navigation", d: "The features that help visitors move around a site.", zh: "导航" },
    { id: "link", g: "l1-nav", w: "link", d: "Something that takes you to another location when selected.", zh: "链接" },
    { id: "button", g: "l1-nav", w: "button", d: "A visible control used to perform an action.", zh: "按钮" },

    { id: "about", g: "l1-sections", w: "about", d: "Information on who the person or organisation is.", zh: "关于（简介页）" },
    { id: "contact", g: "l1-sections", w: "contact", d: "Ways to get in touch.", zh: "联系方式" },
    { id: "work", g: "l1-sections", w: "work / projects", d: "Examples of what someone has made.", zh: "作品；项目" },
    { id: "achievements", g: "l1-sections", w: "achievements", d: "Things someone has successfully accomplished.", zh: "成就", alt: ["achievement"] },

    { id: "visitor", g: "l1-visitors", w: "visitor / user", d: "Someone using the website.", zh: "访客；用户", alt: ["visitors", "users"] },
    { id: "audience", g: "l1-visitors", w: "audience", d: "The people the website communicates with.", zh: "受众" },
    { id: "purpose", g: "l1-visitors", w: "purpose", d: "What the website is intended to achieve.", zh: "目的" },
    { id: "information", g: "l1-visitors", w: "information", d: "Facts or details visitors can find.", zh: "信息" },

    { id: "click", g: "l1-actions1", w: "click / tap", d: "Select something.", zh: "点击；轻触", alt: ["choose", "select"] },
    { id: "scroll", g: "l1-actions1", w: "scroll", d: "Move through a page.", zh: "滚动" },
    { id: "open", g: "l1-actions1", w: "open", d: "Display something.", zh: "打开" },
    { id: "browse", g: "l1-actions1", w: "browse", d: "Look through content.", zh: "浏览" },
    { id: "explore", g: "l1-actions1", w: "explore", d: "Investigate different parts.", zh: "探索" },
    { id: "return", g: "l1-actions1", w: "return", d: "Go back.", zh: "返回" },

    { id: "read", g: "l1-actions2", w: "read", d: "Understand written content.", zh: "阅读" },
    { id: "view", g: "l1-actions2", w: "view", d: "Look at something.", zh: "查看" },
    { id: "watch", g: "l1-actions2", w: "watch", d: "View a video.", zh: "观看" },
    { id: "play", g: "l1-actions2", w: "play", d: "Start a game, sound or video.", zh: "播放；开始" },
    { id: "download", g: "l1-actions2", w: "download", d: "Save a file to your device.", zh: "下载" },
    { id: "submit", g: "l1-actions2", w: "submit", d: "Send an answer or information.", zh: "提交" },

    { id: "top", g: "l1-position1", w: "top", d: "The upper part.", zh: "顶部" },
    { id: "bottom", g: "l1-position1", w: "bottom", d: "The lower part.", zh: "底部" },
    { id: "left", g: "l1-position1", w: "left", d: "The side where English writing starts.", zh: "左边" },
    { id: "right", g: "l1-position1", w: "right", d: "The side where English writing ends.", zh: "右边" },
    { id: "centre", g: "l1-position1", w: "centre", d: "The middle.", zh: "中间；中心", alt: ["middle"] },

    { id: "above", g: "l1-position2", w: "above", d: "Higher than something.", zh: "在……上方" },
    { id: "below", g: "l1-position2", w: "below", d: "Lower than something.", zh: "在……下方", alt: ["under"] },
    { id: "beside", g: "l1-position2", w: "beside", d: "Next to something.", zh: "在……旁边" },
    { id: "between", g: "l1-position2", w: "between", d: "In the space separating things.", zh: "在……之间" },

    { id: "large", g: "l1-size", w: "large", d: "Big in size.", zh: "大的" },
    { id: "small", g: "l1-size", w: "small", d: "Little in size.", zh: "小的" },
    { id: "wide", g: "l1-size", w: "wide", d: "Measuring a lot from side to side.", zh: "宽的" },
    { id: "narrow", g: "l1-size", w: "narrow", d: "Measuring only a little from side to side.", zh: "窄的" },
    { id: "space", g: "l1-size", w: "space", d: "An area between or around things.", zh: "空间；空白处" },
    { id: "gap", g: "l1-size", w: "gap", d: "A space separating elements.", zh: "间隙；空隙" },
    { id: "close", g: "l1-size", w: "close together", d: "With little distance between them.", zh: "靠得很近" },
    { id: "far", g: "l1-size", w: "far apart", d: "With a lot of distance between them.", zh: "相距很远" },

    { id: "colour", g: "l1-colour", w: "colour", d: "The shades used, such as blue, red or yellow.", zh: "颜色；色彩", alt: ["colours"] },
    { id: "bright", g: "l1-colour", w: "bright", d: "Full of light or strong colour.", zh: "明亮的；鲜艳的" },
    { id: "dark", g: "l1-colour", w: "dark", d: "With little light, or deep in colour.", zh: "暗的；深色的" },
    { id: "light", g: "l1-colour", w: "light / pale", d: "Having little darkness or colour intensity.", zh: "浅色的；淡的" },
    { id: "font", g: "l1-colour", w: "font", d: "A style of lettering.", zh: "字体" },
    { id: "bold", g: "l1-colour", w: "bold", d: "Thick lettering.", zh: "粗体的" },
    { id: "capitals", g: "l1-colour", w: "capital letters", d: "Letters such as A, B and C.", zh: "大写字母", alt: ["capital letter", "capitals"] },

    { id: "layout", g: "l1-organisation", w: "layout", d: "How things are arranged on a page.", zh: "布局" },
    { id: "row", g: "l1-organisation", w: "row", d: "Things arranged across.", zh: "行" },
    { id: "column", g: "l1-organisation", w: "column", d: "Things arranged downwards.", zh: "列；栏" },
    { id: "grid", g: "l1-organisation", w: "grid", d: "An arrangement using rows and columns.", zh: "网格" },
    { id: "order", g: "l1-organisation", w: "order", d: "The sequence or organisation of things.", zh: "顺序" },

    { id: "clear", g: "l1-desc1", w: "clear", d: "Easy to see or understand.", zh: "清楚的；清晰的" },
    { id: "readable", g: "l1-desc1", w: "readable", d: "Easy to read.", zh: "易读的" },
    { id: "simple", g: "l1-desc1", w: "simple", d: "Having few complications.", zh: "简单的" },
    { id: "busy", g: "l1-desc1", w: "busy / crowded", d: "Containing many elements close together.", zh: "拥挤的；繁杂的" },
    { id: "organised", g: "l1-desc1", w: "organised", d: "Arranged clearly.", zh: "有条理的；整齐的" },
    { id: "confusing", g: "l1-desc1", w: "confusing", d: "Difficult to understand.", zh: "令人困惑的" },

    { id: "colourful", g: "l1-desc2", w: "colourful", d: "Using several noticeable colours.", zh: "色彩丰富的" },
    { id: "plain", g: "l1-desc2", w: "plain", d: "Having little decoration.", zh: "朴素的；没有装饰的" },
    { id: "friendly", g: "l1-desc2", w: "friendly", d: "Welcoming.", zh: "友好的；亲切的" },
    { id: "serious", g: "l1-desc2", w: "serious", d: "Suggesting a thoughtful or formal purpose.", zh: "严肃的" },
    { id: "fun", g: "l1-desc2", w: "fun", d: "Creating enjoyment.", zh: "有趣的；好玩的" },
    { id: "creative", g: "l1-desc2", w: "creative", d: "Showing imagination.", zh: "有创意的" },

    { id: "choose", g: "l1-choice", w: "choose", d: "Select something.", zh: "选择", alt: ["click", "tap", "select"] },
    { id: "use", g: "l1-choice", w: "use", d: "Include or apply something.", zh: "使用；运用" },
    { id: "notice", g: "l1-choice", w: "notice", d: "Become aware of something.", zh: "注意到" },
    { id: "find", g: "l1-choice", w: "find", d: "Locate something.", zh: "找到" },
    { id: "show", g: "l1-choice", w: "show", d: "Make something visible.", zh: "展示；显示" },
    { id: "help", g: "l1-choice", w: "help", d: "Make something easier.", zh: "帮助" },
    { id: "encourage", g: "l1-choice", w: "encourage", d: "Give someone a reason to act.", zh: "鼓励；促使" },

    /* ---------------- Level 2 Core */
    { id: "branding", g: "l2-design1", w: "branding", d: "The choices that create a recognisable identity for a person or organisation.", zh: "品牌塑造" },
    { id: "visual-identity", g: "l2-design1", w: "visual identity", d: "The connected colours, lettering, images and symbols that make a brand visible.", zh: "视觉形象" },
    { id: "consistent", g: "l2-design1", w: "consistent / consistency", d: "Following the same recognisable approach across the site.", zh: "一致的；一致性" },
    { id: "palette", g: "l2-design1", w: "colour palette", d: "The selected range of colours used.", zh: "配色方案", alt: ["palette"] },
    { id: "typography", g: "l2-design1", w: "typography", d: "The choice and arrangement of lettering.", zh: "文字排版设计" },
    { id: "serif", g: "l2-design1", w: "serif", d: "Lettering with small finishing strokes at the ends of letters.", zh: "衬线字体" },
    { id: "sans-serif", g: "l2-design1", w: "sans-serif", d: "Lettering without small finishing strokes at the ends of letters.", zh: "无衬线字体" },

    { id: "contrast", g: "l2-design2", w: "contrast", d: "A noticeable difference, such as light lettering against a dark background.", zh: "对比；反差" },
    { id: "whitespace", g: "l2-design2", w: "whitespace / negative space", d: "The relatively empty areas around and between elements.", zh: "留白；负空间" },
    { id: "alignment", g: "l2-design2", w: "alignment", d: "How the edges or centres of elements line up.", zh: "对齐" },
    { id: "hierarchy", g: "l2-design2", w: "visual hierarchy", d: "The order of importance suggested by size, position, colour and other choices.", zh: "视觉层次" },
    { id: "hero", g: "l2-design2", w: "homepage hero", d: "The prominent introductory section near the top of a site's main page.", zh: "首页主视觉区" },
    { id: "cta", g: "l2-design2", w: "call to action / CTA", d: "A message or control encouraging visitors to take a particular action.", zh: "行动号召（按钮）" },

    { id: "target-audience", g: "l2-audience1", w: "target audience", d: "The particular group the website is intended to reach.", zh: "目标受众" },
    { id: "ux", g: "l2-audience1", w: "user experience / UX", d: "A visitor's overall impression of using the site.", zh: "用户体验" },
    { id: "responsive", g: "l2-audience1", w: "responsive design", d: "Building a site so that it adapts to different screen sizes.", zh: "响应式设计" },
    { id: "convention", g: "l2-audience1", w: "convention", d: "A familiar feature or arrangement visitors recognise.", zh: "惯例；常规做法" },

    { id: "tone", g: "l2-audience2", w: "tone", d: "The attitude or character communicated by the site.", zh: "基调；语气" },
    { id: "mood", g: "l2-audience2", w: "mood", d: "The feeling or atmosphere the design creates.", zh: "氛围；情绪" },
    { id: "effect", g: "l2-audience2", w: "effect", d: "What a choice makes visitors notice, think, feel or do.", zh: "效果；作用" },
    { id: "impact", g: "l2-audience2", w: "impact", d: "The influence or impression the design creates.", zh: "影响；冲击力" },
    { id: "effective", g: "l2-audience2", w: "effective / effectiveness", d: "Successful in achieving a particular purpose.", zh: "有效的；有效性" },

    { id: "appeal", g: "l2-explain", w: "appeal to", d: "Attract or interest a particular audience.", zh: "吸引", alt: ["appeal"] },
    { id: "communicate", g: "l2-explain", w: "communicate", d: "Make an idea or information understood.", zh: "传达；表达" },
    { id: "emphasise", g: "l2-explain", w: "emphasise", d: "Give something greater attention or importance.", zh: "强调" },
    { id: "stand-out", g: "l2-explain", w: "stand out", d: "Be more noticeable than surrounding elements.", zh: "突出；显眼" },
    { id: "guide", g: "l2-explain", w: "guide", d: "Help visitors move through content or towards an action.", zh: "引导" },
    { id: "compare", g: "l2-explain", w: "compare", d: "Examine similarities and differences.", zh: "比较" },
    { id: "evidence", g: "l2-explain", w: "evidence", d: "A specific visible detail supporting an explanation.", zh: "证据" },
    { id: "explain", g: "l2-explain", w: "explain", d: "Say how or why a choice works.", zh: "解释；说明" },

    { id: "professional", g: "l2-impression1", w: "professional", d: "Appearing skilled and suitable for a working role.", zh: "专业的" },
    { id: "personal", g: "l2-impression1", w: "personal", d: "Communicating something about the individual behind the site.", zh: "有个人特色的；个人的" },
    { id: "approachable", g: "l2-impression1", w: "approachable", d: "Easy to talk to or feel comfortable around.", zh: "平易近人的；容易亲近的" },
    { id: "playful", g: "l2-impression1", w: "playful", d: "Creating a sense of fun or light-heartedness.", zh: "俏皮的；活泼的" },
    { id: "energetic", g: "l2-impression1", w: "energetic", d: "Full of activity or energy.", zh: "充满活力的" },
    { id: "calm", g: "l2-impression1", w: "calm", d: "Peaceful and controlled.", zh: "平静的；沉稳的" },

    { id: "modern", g: "l2-impression2", w: "modern", d: "Associated with current styles or approaches.", zh: "现代的" },
    { id: "traditional", g: "l2-impression2", w: "traditional", d: "Connected to established customs or familiar older styles.", zh: "传统的" },
    { id: "formal", g: "l2-impression2", w: "formal", d: "Using a serious, official or carefully controlled style.", zh: "正式的" },
    { id: "informal", g: "l2-impression2", w: "informal", d: "Using a relaxed or conversational style.", zh: "非正式的；随意的" },
    { id: "welcoming", g: "l2-impression2", w: "welcoming", d: "Making visitors feel invited and comfortable.", zh: "热情的；让人感到受欢迎的" },
    { id: "bold2", g: "l2-impression2", w: "bold", d: "Visually strong, confident or striking.", zh: "醒目的；大胆的" },

    { id: "spacious", g: "l2-impression3", w: "spacious", d: "Having plenty of room between elements.", zh: "宽敞的；空间充足的" },
    { id: "cluttered", g: "l2-impression3", w: "cluttered", d: "Containing too many competing elements.", zh: "杂乱的" },
    { id: "structured", g: "l2-impression3", w: "structured", d: "Arranged according to a clear plan.", zh: "结构清晰的" },
    { id: "irregular", g: "l2-impression3", w: "irregular", d: "Not following a regular pattern or arrangement.", zh: "不规则的" },
    { id: "distinctive", g: "l2-impression3", w: "distinctive", d: "Having recognisable features that make it different.", zh: "有特色的；独特的" },
    { id: "memorable", g: "l2-impression3", w: "memorable", d: "Easy to remember.", zh: "令人难忘的；容易记住的" },

    /* ---------------- Level 3 Stretch */
    { id: "analyse", g: "l3-analysis", w: "analyse", d: "Examine specific choices and explain how they work together.", zh: "分析" },
    { id: "evaluate", g: "l3-analysis", w: "evaluate", d: "Judge how well a design achieves its purpose, using evidence.", zh: "评价；评估" },
    { id: "justify", g: "l3-analysis", w: "justify", d: "Support a choice or judgement with reasons and evidence.", zh: "说明理由；证明……是合理的" },
    { id: "prioritise", g: "l3-analysis", w: "prioritise", d: "Decide what should receive the most attention.", zh: "优先考虑" },
    { id: "intention", g: "l3-analysis", w: "intention", d: "What the designer aims to achieve.", zh: "意图" },

    { id: "focal-point", g: "l3-usability1", w: "focal point", d: "The main area towards which attention is directed.", zh: "视觉焦点" },
    { id: "prominence", g: "l3-usability1", w: "prominence", d: "How noticeable or important an element appears.", zh: "突出程度；显眼" },
    { id: "legibility", g: "l3-usability1", w: "legibility", d: "How easily individual letters and words can be recognised.", zh: "易辨认性" },
    { id: "readability", g: "l3-usability1", w: "readability", d: "How comfortably someone can read a passage of text.", zh: "可读性" },
    { id: "accessibility", g: "l3-usability1", w: "accessibility", d: "Design that enables people with different needs and abilities to use the site.", zh: "无障碍性（可访问性）" },
    { id: "usability", g: "l3-usability1", w: "usability", d: "How easily visitors can complete tasks on the site.", zh: "易用性" },

    { id: "intuitive", g: "l3-usability2", w: "intuitive", d: "Easy to understand or use without much explanation.", zh: "直观易懂的" },
    { id: "clutter", g: "l3-usability2", w: "clutter", d: "An excess of elements that compete for attention.", zh: "杂乱（过多的元素）" },
    { id: "balance", g: "l3-usability2", w: "balance", d: "How visual weight is distributed across the page.", zh: "平衡" },
    { id: "symmetry", g: "l3-usability2", w: "symmetry", d: "A matching arrangement on either side.", zh: "对称" },
    { id: "asymmetry", g: "l3-usability2", w: "asymmetry", d: "A non-matching arrangement on either side.", zh: "不对称" },

    { id: "repetition", g: "l3-usability3", w: "repetition", d: "Reusing a feature to create a connection or pattern.", zh: "重复" },
    { id: "cohesion", g: "l3-usability3", w: "cohesion", d: "How well the parts of the site feel connected.", zh: "整体统一感；连贯性" },
    { id: "differentiation", g: "l3-usability3", w: "differentiation", d: "Making something recognisably different from other examples.", zh: "差异化" },
    { id: "credibility", g: "l3-usability3", w: "credibility", d: "How trustworthy or believable the site appears.", zh: "可信度" },
    { id: "engagement", g: "l3-usability3", w: "engagement", d: "The attention and involvement a site encourages.", zh: "参与度" },

    { id: "interaction", g: "l3-technical", w: "interaction", d: "An action through which a visitor uses or changes something on the site.", zh: "交互；互动" },
    { id: "feedback", g: "l3-technical", w: "feedback", d: "A visible response confirming what happened after an action.", zh: "反馈" },
    { id: "hover", g: "l3-technical", w: "hover state", d: "How an element changes when a pointer rests over it.", zh: "悬停状态" },
    { id: "aspect-ratio", g: "l3-technical", w: "aspect ratio", d: "The relationship between an image's width and height.", zh: "宽高比" },
    { id: "resolution", g: "l3-technical", w: "resolution", d: "The amount of detail available in an image, commonly expressed through pixel dimensions.", zh: "分辨率" },
    { id: "compression", g: "l3-technical", w: "compression", d: "Reducing a file's size to make it easier to store or load.", zh: "压缩" },
    { id: "loading-time", g: "l3-technical", w: "loading time", d: "How long content takes to appear.", zh: "加载时间", alt: ["load time"] },

    { id: "prompt", g: "l3-prompting1", w: "prompt", d: "Instructions given to an AI tool.", zh: "提示词" },
    { id: "brief", g: "l3-prompting1", w: "design brief", d: "A statement of the website's purpose, audience and requirements.", zh: "设计简报；设计任务书", alt: ["brief"] },
    { id: "requirement", g: "l3-prompting1", w: "requirement", d: "Something the design must include or achieve.", zh: "要求；需求" },
    { id: "constraint", g: "l3-prompting1", w: "constraint", d: "A limit the designer must work within.", zh: "限制条件" },
    { id: "generate", g: "l3-prompting1", w: "generate", d: "Produce content or a design using a tool.", zh: "生成" },

    { id: "revise", g: "l3-prompting2", w: "revise", d: "Change something after reviewing it.", zh: "修改" },
    { id: "refine", g: "l3-prompting2", w: "refine", d: "Improve particular details.", zh: "完善；细化" },
    { id: "test", g: "l3-prompting2", w: "test", d: "Check whether something works as intended.", zh: "测试" },
    { id: "iteration", g: "l3-prompting2", w: "iteration", d: "A version developed through a cycle of making, testing and changing.", zh: "迭代（版本）" }
  ],

  /* Words close enough in meaning that they are never offered as rival answers. */
  ALIKE: [
    ["click", "choose", "interaction"], ["open", "show", "communicate"], ["view", "watch", "read", "play"], ["browse", "explore"],
    ["find", "notice"], ["visitor", "audience", "target-audience"], ["portfolio", "gallery", "work", "project"],
    ["website", "webpage", "homepage"], ["homepage", "hero"], ["heading", "subheading"], ["menu", "navigation", "guide"],
    ["help", "guide"], ["link", "button"], ["space", "gap", "whitespace", "spacious"], ["large", "wide"], ["small", "narrow"],
    ["busy", "cluttered", "clutter", "confusing"], ["clear", "readable", "readability", "legibility", "intuitive"],
    ["simple", "plain"], ["organised", "structured"], ["friendly", "welcoming", "approachable"], ["fun", "playful", "energetic"],
    ["serious", "formal", "professional"], ["traditional", "formal"], ["colour", "palette", "colourful"], ["bright", "light"],
    ["font", "typography", "serif", "sans-serif"], ["bold", "bold2"], ["effect", "impact", "effective", "mood", "tone"],
    ["emphasise", "stand-out", "prominence", "focal-point"], ["hierarchy", "prominence", "prioritise", "order"],
    ["encourage", "cta", "appeal", "engagement"], ["consistent", "cohesion", "repetition"],
    ["distinctive", "memorable", "differentiation", "creative"], ["branding", "visual-identity", "logo", "name"],
    ["analyse", "evaluate", "compare", "explain", "justify", "evidence"], ["revise", "refine", "iteration", "test"],
    ["usability", "ux", "intuitive", "accessibility"], ["resolution", "aspect-ratio"], ["compression", "loading-time"],
    ["information", "content", "about"], ["purpose", "intention"], ["layout", "grid"], ["balance", "symmetry"],
    ["irregular", "asymmetry"], ["requirement", "brief"], ["above", "top"], ["below", "bottom"], ["section", "content"]
  ]
};
