// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const activityIndicatorPrimaryColorRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce ActivityIndicator color to use colors.primary',
    },
    schema: [],
    messages: {
      missingColor:
        'ActivityIndicator must specify color={colors.primary}.',
      invalidColor:
        'ActivityIndicator color must be set to colors.primary.',
    },
  },
  create(context) {
    const isColorsPrimaryExpression = (expression) => {
      return (
        expression &&
        expression.type === 'MemberExpression' &&
        !expression.computed &&
        expression.object?.type === 'Identifier' &&
        expression.object.name === 'colors' &&
        expression.property?.type === 'Identifier' &&
        expression.property.name === 'primary'
      );
    };

    return {
      JSXOpeningElement(node) {
        if (node.name?.type !== 'JSXIdentifier' || node.name.name !== 'ActivityIndicator') {
          return;
        }

        const colorAttribute = node.attributes.find(
          (attribute) =>
            attribute?.type === 'JSXAttribute' &&
            attribute.name?.type === 'JSXIdentifier' &&
            attribute.name.name === 'color'
        );

        if (!colorAttribute) {
          context.report({ node, messageId: 'missingColor' });
          return;
        }

        const colorValue = colorAttribute.value;
        if (
          !colorValue ||
          colorValue.type !== 'JSXExpressionContainer' ||
          !isColorsPrimaryExpression(colorValue.expression)
        ) {
          context.report({ node: colorAttribute, messageId: 'invalidColor' });
        }
      },
    };
  },
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    plugins: {
      bondify: {
        rules: {
          'activity-indicator-primary-color': activityIndicatorPrimaryColorRule,
        },
      },
    },
    rules: {
      'bondify/activity-indicator-primary-color': 'error',
    },
  },
]);
