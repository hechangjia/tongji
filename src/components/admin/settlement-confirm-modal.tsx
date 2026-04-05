"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SettlementConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    totalAmount: number;
    memberCount: number;
    riskCount: number;
  };
  onConfirm: () => Promise<void>;
}

export function SettlementConfirmModal({
  isOpen,
  onClose,
  stats,
  onConfirm,
}: SettlementConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting && !isSuccess) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, isSuccess, onClose]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setIsChecked(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRisks = stats.riskCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!isSubmitting && !isSuccess) onClose(); }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 id="modal-title" className="text-lg font-semibold text-slate-900">确认一键结算</h2>
                <button
                  onClick={onClose}
                  disabled={isSubmitting || isSuccess}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-medium text-slate-900">结算成功</h3>
                    <p className="text-slate-500 mt-2">所选批次的佣金状态已更新</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-[16px] bg-slate-50 p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500">结算人数</span>
                        <span className="font-semibold">{stats.memberCount} 人</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                        <span className="text-slate-500">预估总额</span>
                        <span className="text-2xl font-bold text-cyan-600">¥{stats.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {hasRisks && (
                      <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800 text-sm">存在规则缺失</h4>
                          <p className="text-amber-700/80 text-xs mt-1">
                            有 {stats.riskCount} 名成员缺少相应的佣金计算规则，本次结算将跳过这些成员。
                          </p>
                        </div>
                      </div>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="flex h-5 items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
                        />
                      </div>
                      <div className="text-sm text-slate-600">
                        我已核对上述结算金额，并确认执行发放操作。该操作执行后状态将无法撤销。
                      </div>
                    </label>

                    <button
                      onClick={handleConfirm}
                      disabled={!isChecked || isSubmitting}
                      className="w-full flex justify-center items-center py-3 px-4 rounded-[16px] text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors font-medium"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-white" />
                      ) : (
                        "确认发放佣金"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
