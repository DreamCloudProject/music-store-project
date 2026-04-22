export interface FilterOption {
  value: string;
  label: string;
}

export const defaultArtistOptions: FilterOption[] = [
  { value: "michael-jackson", label: "Michael Jackson" },
  { value: "frank-sinatra", label: "Frank Sinatra" },
  { value: "calvin-harris", label: "Calvin Harris" },
  { value: "zhu", label: "Zhu" },
  { value: "arctic-monkeys", label: "Arctic Monkeys" },
];

export const defaultGenreOptions: FilterOption[] = [
  { value: "rock", label: "Рок" },
  { value: "hiphop", label: "Хип-хоп" },
  { value: "pop", label: "Поп-музыка" },
  { value: "techno", label: "Техно" },
  { value: "indie", label: "Инди" },
];
