"use client";
import React from "react";
import { ethers } from "ethers";

export interface VoteSummaryProps {
  yesVotes: bigint;
  noVotes: bigint;
  yesCount?: number;
  noCount?: number;
  thresholdBps?: number; // e.g. 8000 => 80%
}

const formatPexAmount = (v: bigint) => {
  try {
    const s = ethers.formatEther(v);
    const [intPart, decPartRaw] = s.split(".");
    if (!decPartRaw) return `${intPart} PAS`;
    const decPart = decPartRaw.slice(0, 6).replace(/0+$/, "");
    return `${intPart}${decPart ? "." + decPart : ""} PAS`;
  } catch {
    return `${String(v)} wei`;
  }
};

export default function VoteSummary({ yesVotes, noVotes, yesCount = 0, noCount = 0, thresholdBps }: VoteSummaryProps) {
  const yesNum = Number(ethers.formatEther(yesVotes || 0n));
  const noNum = Number(ethers.formatEther(noVotes || 0n));
  const total = yesNum + noNum;
  const pctYes = total > 0 ? (yesNum / total) * 100 : 0;
  const pctNo = total > 0 ? (noNum / total) * 100 : 0;
  const thresholdPct = typeof thresholdBps === "number" ? thresholdBps / 100 : undefined; // bps -> %

  const yesPctLabel = `${pctYes.toFixed(1)}%`;
  const noPctLabel = `${pctNo.toFixed(1)}%`;
  const thrLabel = thresholdPct !== undefined ? `${thresholdPct.toFixed(1)}%` : undefined;

  return (
    <div className="mt-3 rounded-md border border-gray-200 p-3">
      {/* Stacked progress bar: single container, two segments, equal height */}
      <div className="relative h-3 w-full overflow-hidden rounded bg-gray-100">
        {/* Left segment: Aye */}
        <div
          className="h-full bg-green-500"
          style={{ width: `${pctYes}%` }}
        />
        {/* Right segment: Nay fills remaining space using absolute to avoid layout wrap issues */}
        <div
          className="absolute inset-y-0 right-0 h-full bg-red-500"
          style={{ width: `${100 - pctYes}%` }}
        />
        {thresholdPct !== undefined && (
          <div className="absolute inset-y-0" style={{ left: `${thresholdPct}%` }}>
            <div className="h-full w-px bg-gray-700/70" />
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="mt-2 flex w-full text-sm text-gray-700">
        <div className="flex-1">{yesPctLabel} Aye</div>
        <div className="flex-1 text-center">{thrLabel ? `${thrLabel} Threshold` : ``}</div>
        <div className="flex-1 text-right">{noPctLabel} Nay</div>
      </div>

      {/* Totals */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {/* Left cluster: Aye label + amount aligned left */}
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span> Aye ({yesCount})</span>
          <span>≈ {formatPexAmount(yesVotes)}</span>
        </div>
        {/* Right cluster: align to right, Nay label before amount */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-red-600">✗</span>
          <span> Nay ({noCount})</span>
          <span>≈ {formatPexAmount(noVotes)}</span>
        </div>
      </div>
    </div>
  );
}