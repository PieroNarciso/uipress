import colors from 'picocolors';

export const info = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `${colors.dim(timestamp)} ${colors.bold(
      colors.cyan("ui-press")
    )} ${colors.green(message)}`
  );
};
