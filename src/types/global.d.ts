interface Window {
  twttr?: {
    widgets: {
      createTweet: (
        tweetId: string,
        container: HTMLElement,
        options?: {
          theme?: "light" | "dark";
          align?: "left" | "center" | "right";
        }
      ) => Promise<HTMLElement>;
    };
  };
}
