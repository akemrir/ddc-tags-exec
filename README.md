# ddc tags exec

It uses vim tags variable with list of tag files and queries it with supplied command to get list of tags for ddc menu.


## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

## setup

Set up vim:

```
Plug 'akemrir/ddc-tags-exec'
```

With ugrep

```
call ddc#custom#patch_global('sources', ['tags-exec'])
call ddc#custom#patch_global('sourceParams', {
  \ 'tags-exec': {
  \   'maxSize': 100,
  \   'cmd': ['ug', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color=never'],
  \   'appendTagFiles': v:true
  \ })
```

Ugrep also provides fuzzy matching with Levenstein algorithm.
  \   'cmd': ['ug', '-Z3', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color=never'],

To use with ddc fuzzy filter:
https://github.com/tani/ddc-fuzzy

With ugrep but with splitting strategy

```
  \ 'tags-exec': {
  \   'maxSize': 30,
  \   'cmd': ['ug', '--bool', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color=never'],
  \   'appendTagFiles': v:true,
  \   'splitByRegexp': '(?=[A-Z])|_',
  \   'splitUnionString': ' ',
```

Regexp: (?=[A-Z])|_
This strategy leverages split and join

PascalCasedText -> Pascal Cased Text
require_relative -> require relative

Then it is used with ugrep --bool
Bool makes this construction connected like with 'and'

Pascal and Cased and Text

ug --bool '^Pascal Cased Text[_A-Za-z0-9-]*\t --color=never tags
ug --bool '^require_relative[_A-Za-z0-9-]*\t --color=never tags

With ripgrep

```
'cmd': ['rg', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color', 'never', '-IN'],
```

Postgresql psql

```
'cmd': [
\  'psql', 'postgres://superuser:superuserpass@127.0.0.1:8000/tags', '-c',
\  "\copy (select word, menu, 'empty' as empty, kind from tags where word LIKE '{PLACEHOLDER}%' order by word asc) to stdout"
\],
'appendTagFiles': v:false
```
