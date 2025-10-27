import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrencyPrice);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-2 px-1 mb-11 lg:mb-0 relative">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
            {/* {nativeCurrencyPrice > 0 && (
              <div>
                <div className="btn btn-primary btn-sm font-normal gap-1 cursor-auto">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span>{nativeCurrencyPrice}</span>
                </div>
              </div>
            )} */}
            {/* {isLocalNetwork && (
              <>
                <Faucet />
                <Link href="/blockexplorer" passHref className="btn btn-primary btn-sm font-normal gap-1">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>区块浏览器</span>
                </Link>
              </>
            )} */}
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full backdrop-blur-sm py-3 rounded-t-lg">
        {/* <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-4 text-sm w-full">
            <div className="text-center">
              <a href="https://github.com/huahuahua1223/NFTMarket" target="_blank" rel="noreferrer" className="link">
                项目源码
              </a>
            </div>
            <span>·</span>
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center">
                瓷板画确权平台 <HeartIcon className="inline-block h-4 w-4" />
              </p>
            </div>
            <span>·</span>
            <div className="text-center">
              <Link href="/about" className="link">
                关于我们
              </Link>
            </div>
            <span>·</span>
            <div className="text-center">
              <Link href="/privacy" className="link">
                隐私政策
              </Link>
            </div>
            <span>·</span>
            <div className="text-center">
              <Link href="/contact" className="link">
                联系方式
              </Link>
            </div>
          </div>
        </ul> */}
        <div className="text-center text-base mt-2 text-base-content">
          © {new Date().getFullYear()} 瓷板画数字确权平台 · 版权所有
        </div>
      </div>
    </div>
  );
};
