/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {PointType, TextNode} from 'lexical';

import './CodeHighlighterPrism';

import {
  $createLineBreakNode,
  $createTabNode,
  $isTabNode,
  $isTextNode,
  ElementNode,
} from 'lexical';

import {
  $createCodeHighlightNode,
  $isCodeHighlightNode,
  getFirstCodeNodeOfLine,
} from './CodeHighlightNode';
import {highlighting} from './CodeNode';

const mapToPrismLanguage = (
  language: string | null | undefined,
): string | null | undefined => {
  // eslint-disable-next-line no-prototype-builtins
  return language != null && window.Prism.languages.hasOwnProperty(language)
    ? language
    : undefined;
};

const textNodeCheck = (
  firstSelectionNode: ElementNode | TextNode,
  anchor: PointType,
) => {
  if (!$isTextNode(firstSelectionNode)) {
    return;
  }

  let node = getFirstCodeNodeOfLine(firstSelectionNode);
  const insertNodes = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if ($isTabNode(node)) {
      insertNodes.push($createTabNode());
      node = node.getNextSibling();
    } else if ($isCodeHighlightNode(node)) {
      let spaces = 0;
      const text = node.getTextContent();
      const textSize = node.getTextContentSize();
      while (spaces < textSize && text[spaces] === ' ') {
        spaces++;
      }
      if (spaces !== 0) {
        insertNodes.push($createCodeHighlightNode(' '.repeat(spaces)));
      }
      if (spaces !== textSize) {
        break;
      }
      node = node.getNextSibling();
    } else {
      break;
    }
  }
  const split = firstSelectionNode.splitText(anchor.offset)[0];
  const x = anchor.offset === 0 ? 0 : 1;
  const index = split.getIndexWithinParent() + x;
  const codeNode = firstSelectionNode.getParentOrThrow();
  const nodesToInsert = [$createLineBreakNode(), ...insertNodes];
  codeNode.splice(index, 0, nodesToInsert);
  const last = insertNodes[insertNodes.length - 1];
  if (last) {
    last.select();
  } else if (anchor.offset === 0) {
    split.selectPrevious();
  } else {
    split.getNextSibling()!.selectNext(0, 0);
  }
};

export const addPrismToCodeNode = () => {
  highlighting.textNodeCheck = textNodeCheck;
  highlighting.mapToPrismLanguage = mapToPrismLanguage;
};
