{ pkgs, ... }:

{
  packages = with pkgs; [
    hugo
    just
    wrangler
    dart-sass
  ];

  processes.site.exec = "hugo server -D";
}
