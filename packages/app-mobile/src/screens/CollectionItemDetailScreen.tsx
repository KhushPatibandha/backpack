import { Suspense } from "react";
import { Alert, View, Text, ScrollView } from "react-native";

import * as Linking from "expo-linking";

import { useFragment_experimental } from "@apollo/client";
import {
  Blockchain,
  UNKNOWN_NFT_ICON_SRC,
  explorerNftUrl,
} from "@coral-xyz/common";
import {
  useEthereumExplorer,
  useSolanaExplorer,
  useBlockchainConnectionUrl,
} from "@coral-xyz/recoil";
import { Box } from "@coral-xyz/tamagui";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { ErrorBoundary } from "react-error-boundary";

import { CollectionAttributes } from "~components/CollectionAttributesList";
import {
  PrimaryButton,
  ProxyImage,
  Screen,
  SecondaryButton,
  FullScreenLoading,
} from "~components/index";
import { useTheme } from "~hooks/useTheme";
import { NftNodeFragment } from "~screens/CollectionListScreen";

function ActionMenu({ blockchain, nft }: { blockchain: Blockchain; nft: any }) {
  const connectionUrl = useBlockchainConnectionUrl(blockchain);
  const ethExpl = useEthereumExplorer();
  const solExpl = useSolanaExplorer();

  const { showActionSheetWithOptions } = useActionSheet();

  // @ts-ignore
  const isEthereum: boolean = nft && nft.contractAddress;
  const explorer = isEthereum ? ethExpl : solExpl;

  const viewExplorerUrl = () => {
    try {
      const url = explorerNftUrl(explorer, nft, connectionUrl);
      Linking.openURL(url);
    } catch (error) {
      console.error("viewExplorerUrl:error", error);
      Alert.alert("Something went wrong", "Invalid URL");
    }
  };

  const onPress = () => {
    const options = ["View on Explorer", "Cancel"];
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (selectedIndex: number) => {
        switch (selectedIndex) {
          case 0: {
            viewExplorerUrl();
            break;
          }

          case cancelButtonIndex:
          // Canceled
        }
      }
    );
  };

  return <SecondaryButton label="Options" onPress={onPress} />;
}

function Description({ description }: { description: string }) {
  const theme = useTheme();
  if (!description || description === "") {
    return null;
  }

  return (
    <View
      style={{
        marginTop: 20,
      }}
    >
      <Text
        style={{
          color: theme.custom.colors.secondary,
          fontWeight: "500",
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 4,
        }}
      >
        Description
      </Text>
      <Text
        style={{
          color: theme.custom.colors.fontColor,
          fontWeight: "500",
          fontSize: 16,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

function NftImage({ imageUrl }: { imageUrl: string }): JSX.Element {
  return (
    <ProxyImage
      style={{
        width: "100%",
        borderRadius: 8,
        aspectRatio: 1,
      }}
      src={imageUrl ?? UNKNOWN_NFT_ICON_SRC}
    />
  );
}

function Container({ navigation, route }): JSX.Element {
  const { blockchain } = route.params;
  const { data: item } = useFragment_experimental({
    fragment: NftNodeFragment,
    fragmentName: "NftNodeFragment",
    from: {
      __typename: "Nft",
      id: route.params.id,
    },
  });

  return (
    <ScrollView>
      <Screen>
        <NftImage imageUrl={item.image} />
        <Description description={item.description} />
        <Box marginVertical={12}>
          <PrimaryButton
            label="Send"
            onPress={() => {
              navigation.push("SendNFT", { nft: item });
            }}
          />
        </Box>
        <CollectionAttributes attributes={item.attributes} />
        <ActionMenu nft={item} blockchain={blockchain} />
      </Screen>
    </ScrollView>
  );
}

export function CollectionItemDetailScreen({
  navigation,
  route,
}: any): JSX.Element {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <Text>{error.message}</Text>}>
      <Suspense fallback={<FullScreenLoading />}>
        <Container navigation={navigation} route={route} />
      </Suspense>
    </ErrorBoundary>
  );
}
