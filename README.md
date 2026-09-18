# **Extra Chess.com Focus Mode**

A Chrome extension for chess.com that hides the opponent's rating, title, premium badge, profile picture, country flag, flair, and connection indicator during live games. Each element can be covered with a question mark, blurred at a custom strength, or removed entirely, and every option can be toggled from the toolbar popup.

Settings are stored locally and applied in real time. Hiding is re-applied automatically through a MutationObserver whenever chess.com re-renders the board, and the extension can also fake your own title, ELO, premium badge, and flair.