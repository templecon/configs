// Loosely typed mocks that the base preset allows under `tests/**`.

const mock = JSON.parse("{}");

mock.reset();
export const label: string = mock.label;
export const read = (): string => mock.read();
