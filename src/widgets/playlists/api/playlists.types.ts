/** UI/домен: плейлист (= CMS Product в category `playlists`, не Product-артист). */
export interface Playlist {
  id: string;
  title: string;
  /** SKU.id треков плейлиста (CMS Product.skuIds). */
  skuIds: string[];
}

export type PlaylistsResponse = Playlist[];
