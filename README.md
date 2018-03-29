# dx-colors-design

An open source version of [px-colors-design](https://github.com/predixdesignsystem/px-colors-design). Use this Sass partial to theme Predix Design System web components.

Colors are from the [Material Design colors palette](https://www.materialui.co/colors).

## Install in your project

Install this module using bower:

```bash
$ bower install --save dxelements/dx-colors-design
```

**Use the SCSS variables**

Once installed, `@import` into your project's Sass file in its Settings layer. If you are also importing px-defaults-design, make sure you import dx-colors-design later in the file.

```SCSS
@import "dx-colors-design/_settings.colors.scss";
```

Later in your SCSS file, use one of the variables:

```SCSS
.alertbox {
  color: $white;
  background-color: $status-yellow4;
}
```

**Use the style module**

You can also load the `colors-shared-styles.html` style module to expose all colors as global CSS variables:

```html
<link rel="import" href="../px-colors-design/colors-shared-styles.html"/>
<custom-style>
  <style include="colors-shared-styles">
    .alertbox {
      color: --px-white;
      background-color: --px-status-yellow4;
    }
  </style>
</custom-style>
```

**Use the JSON**

The colors are also available as a JSON document in `colors.json`. The JSON is in the following format:

```JSON
{
  "black": "rgb(0,0,0)",
  "gray20": "rgb(19,28,35)"
}
```

Load the JSON in your front-end app or use it during your build process to have access to the colors at all times.

## License (MIT)

See the `LICENSE` file for more information.
