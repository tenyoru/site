{ pkgs, ... }:

{
  packages = with pkgs; [
    hugo
    just
    wrangler
  ];

  processes.site.exec = "hugo server -D";
}
