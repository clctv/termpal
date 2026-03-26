# Changelog

## [1.2.2](https://github.com/clctv/termpal/compare/1.2.1...1.2.2) (2026-03-26)

### Performance Improvements

- should update ui before onChange ([6254e81](https://github.com/clctv/termpal/commit/6254e811dac177e5d7ffd6d836c942cb2e5bf07c))

## [1.2.1](https://github.com/clctv/termpal/compare/1.2.0...1.2.1) (2026-03-26)

### Performance Improvements

- optimize select performance ([30c6059](https://github.com/clctv/termpal/commit/30c6059fa59fb2ad47ac048d50b4dc089a5bed4c))

# [1.2.0](https://github.com/clctv/termpal/compare/1.1.0...1.2.0) (2026-03-19)

### Bug Fixes

- remove useless lastPreview logic ([abcedcc](https://github.com/clctv/termpal/commit/abcedccb88cfdc0d163b87cd1f651c26e4a4557d))

### Features

- add Kanagawa theme ([a5893bb](https://github.com/clctv/termpal/commit/a5893bb9dab0f9f639585d1759cdcc15b7635e5c))
- remove Monokai,RosePine,NightOwl and add GitHubDark,AyuDark ([f06876e](https://github.com/clctv/termpal/commit/f06876e2a5352ef228283961fbbe3a84a2923893))

# [1.1.0](https://github.com/clctv/termpal/compare/1.0.1...1.1.0) (2026-03-18)

### Features

- add MonokaiPro and MonokaiDimmed theme ([6caa709](https://github.com/clctv/termpal/commit/6caa7093b9972f0496256a173b441cc869f4194b))
- use theme length as pageSize ([9def19f](https://github.com/clctv/termpal/commit/9def19f62e32d0143a27c8f2fec29f070d8ea37a))

### Performance Improvements

- remove @inquirer/select ([be49b72](https://github.com/clctv/termpal/commit/be49b72cca42495f3456f0d47f479601c616e420))

## [1.0.1](https://github.com/clctv/termpal/compare/1.0.0...1.0.1) (2026-03-17)

### Bug Fixes

- keep interactive picker behavior consistent by deriving currentSelection from persisted state ([b48112e](https://github.com/clctv/termpal/commit/b48112e83c2d28efda463bb63a5fac49aa721e7a))
- remove built-in theme detect ([5e59157](https://github.com/clctv/termpal/commit/5e59157b95229c02f1a7be159dc0d3257b251542))

### Performance Improvements

- optimized file-read paths in cli.ts to avoid using exceptions ([f963de6](https://github.com/clctv/termpal/commit/f963de6404b5b8bc951b8a55bb314f7e67818d64))

# [1.0.0](https://github.com/clctv/termpal/compare/0.5.0...1.0.0) (2026-03-16)

### Bug Fixes

- should only write osc for once ([97ef2f1](https://github.com/clctv/termpal/commit/97ef2f1534109541d34bbf0f4799f6839b67dd12))

### Features

- auto detect active theme ([a0f19b2](https://github.com/clctv/termpal/commit/a0f19b227a234ae4771c93e42fcd95f2a22acabf))
- rename api ([2454bd5](https://github.com/clctv/termpal/commit/2454bd51e7e28577301a324e04849ecaea1a446d))
- support -v ([e8e69d3](https://github.com/clctv/termpal/commit/e8e69d3a6846b2afe3a64540131aeb0fc4b31779))
- support auto apply in new terminal session ([55e6d5a](https://github.com/clctv/termpal/commit/55e6d5a97eb812fcaf4777f735032131a5ccd5bf))
- support cli ([1802069](https://github.com/clctv/termpal/commit/1802069df9edcd770185a01e42028247d7cd593d))

# [0.5.0](https://github.com/clctv/termpal/compare/0.4.0...0.5.0) (2026-03-13)

### Bug Fixes

- apply colors separately ([21cbbb8](https://github.com/clctv/termpal/commit/21cbbb8e3c0d05065f9a03ff6eeeb0e596467371))

### Features

- add more theme ([6504ea2](https://github.com/clctv/termpal/commit/6504ea2844d62ce843cb5cbc570e23678c05042f))
- add theme SolarizedDark,Monokai,RosePine,NightOwl ([2e3b386](https://github.com/clctv/termpal/commit/2e3b3869b24b3231b3c8072aa429a60c9577ecf7))

# [0.4.0](https://github.com/clctv/termpal/compare/0.3.0...0.4.0) (2026-03-13)

### Features

- add Dracula theme ([12e7b47](https://github.com/clctv/termpal/commit/12e7b473509c3f14096421498ac14d49378ba3dd))

# [0.3.0](https://github.com/clctv/termpal/compare/0.2.0...0.3.0) (2026-03-13)

### Features

- change Catppuccin theme ([2074fc9](https://github.com/clctv/termpal/commit/2074fc9267f5a45bb0408388a8b9850329c48359))
- rename export name ([0dfcb96](https://github.com/clctv/termpal/commit/0dfcb96b9659cf212c9ea2bdb842e16f4995fa76))
- rename use to useTheme ([2883e2d](https://github.com/clctv/termpal/commit/2883e2d528a6498b5528cf7473a5f5e737bb5707))

# [0.2.0](https://github.com/clctv/termpal/compare/0.1.0...0.2.0) (2026-03-12)

### Features

- add built-in theme ([d95d7b9](https://github.com/clctv/termpal/commit/d95d7b965618599d51abe597027852e2fc4ad22f))
- add description ([6a6e68e](https://github.com/clctv/termpal/commit/6a6e68ea2fb8c374669bf561aa570687d16cac83))

# 0.1.0 (2026-03-12)

### Features

- add keywords ([d468c30](https://github.com/clctv/termpal/commit/d468c30e7a6d7b49666e21807a1c0018ebf1d956))
- complete readme ([c2591a6](https://github.com/clctv/termpal/commit/c2591a676c1ca0491e19138ead443816e9c0091f))
- init ([4bd8e31](https://github.com/clctv/termpal/commit/4bd8e3113041986cbc17975ce6d70ac3550acd7a))
