# ddc tags exec

It uses vim tags variable with list of tag files and queries it with supplied command to get list of tags for ddc menu.

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

With ripgrep

```
'cmd': ['rg', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color', 'never', '-IN'],
```
