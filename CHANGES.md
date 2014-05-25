GSS Engine ChangeLog
====================

## 1.0.3-beta (May 24th 2014)

- Selectors other than id, class & tag can now be used in CCSS when surrounded by parans:

```css
    (.section > article:not(.featured))[font-size] == 100;
``` 

- Support for plural selectors on either side of a constraint operator:

```css
    .article[font-size] == .header[font-size];    
    
    @h |[.a][.b]| in(.cont) chain-width;
    
    .container {
      @h |[.itemA][.itemB]| in(::) chain-width;
    }
```

- 2D sugar props: `size`, `position`, `center`, `intrinsic-size`, `top-left`, `top-right`, `bottom-left`, `bottom-right`


## 1.0.2-beta (April 14th 2014)

- VGL: `@grid-template` empty zones can be defined with `.`
- VGL: added `in()` to `@grid-template`
- VGL: added `h/v/top/right/bottom/left-gap()` to `@grid-template`

VGL is still undocumented & under heavy dev.

## 1.0.1-beta (April 7th 2014)

- VFL: **Point** support
- VFL: shorthands `@h` & `@v` for `@horizontal` & `@vertical`
- VFL: `outer-gap()`
- VFL: Default containing element selector to `::this`

### New VFL Sugar

With the new VFL API sugar, the following:

```css
    #container {
      @h |-[#a]-[#b]-| gap(10) outer-gap(20);
    }
``` 
  
is equivalent too: 

```css
    @horizontal |-20-[#a]-10-[#b]-20-| in(#container);    
``` 

### VFL Points

Elements can be aligned relative to arbitrary positioned points using `< Number | Constraint Variable | Element Property >`

To horizontally align two buttons, each 8px from the center of the window:

```css
/* VFL */
@h [#btn1]-<::window[center-x]>-[#btn2] gap(8);

/* Equivalent CCSS */
#btn1[right] + 8 == ::window[center-x];
::window[center-x] + 8 == #btn2[left];
```

Alignments can be positioned within points:

```css
/* VFL */
@h <#wall[center-x]>-[#poster]-[#clock]-<::window[right])> gap(7);

/* Equivalent CCSS */
#wall[center-x] + 7 == #poster[left];
#poster[right] + 7 == #clock[left];
::window[right] - 7 == #clock[right];
```

Numbers, variables and arithmetic can be used:

```css
/* VFL */
@v <100>[#box]<[row2]>;

/* Equivalent CCSS */
100 == #box[top];
#box[bottom] == [row2];
```css

