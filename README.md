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
