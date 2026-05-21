/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TextSegment {
  text: string;
  className?: string;
}

export interface CardItem {
  id: string;
  number: string;
  title: string;
  iconUrl: string;
  items: string[];
}
