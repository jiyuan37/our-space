# AVATAR-01 身份一致性约束与明确拒绝

起点 `1d4c6a2a2847701df73d1f17b7a254c9e3bdbce4`，main、干净、origin/main 0/0。用户明确指出自拍无眼镜而本次生成有眼镜，因此将当前未确认候选视为 identity mismatch。本轮不另行处理自拍或发出真实模型请求，外部调用0次。

## Prompt 与参考

模板升级为 `flux-style0-identity1-v3`，资源风格关联为 `pixel-big-head-b6fe15a-identity-v3`：

- 图1是唯一身份事实依据，保留可见发色、发长、分缝/刘海、脸型及稳定特征。
- 自拍无眼镜时，输出必须无眼镜；不得新增自拍中不存在的帽子、耳环、胡子、发饰或其他身份配饰，不猜测看不见的特征。
- 图0仅提供像素画风、比例、轮廓和色彩。禁止复制其配饰、脸、发型或身份，图1身份事实优先。
- 原有圆润大头、极少肩部、清楚表情、无状态道具要求保持。输入仍为style0 480×320 PNG + <=480px自拍1，双边<512；不改模型或添加guidance。

检查批准原型导出的参考：两名角色均无眼镜、帽子、耳环、胡子；长发角色原有小金色发夹已仅从参考副本中移除。导出脚本仍校验b6fe15a批准提交的原始代码，原型人物未改。移除已知发夹路径、无道具和输出尺寸均有离线断言，并实际渲染查看。上次真实请求并未发送style reference，不能把上次新增眼镜归因为参考泄漏。

## UI / 服务层拒绝

本人预览时显著提示：新增眼镜、帽子、耳环、胡子或发饰属于身份不符，不能当成风格变化。「身份不符，拒绝这张」保存人工验收拒绝原因；刷新和切换语言仍显示拒绝标题，移除确认按钮/勾选框。

新增支撑模型可空字段 `AvatarGeneration.rejectionReason`，值为 `IDENTITY_MISMATCH`，与provider的failureStage分开；追加migration `20260907010000_avatar_identity_rejection`，不改旧migration或核心实体。拒绝任务为FAILED，保留本人私密display/source至原到期时间；仍可取消清理。Partner不能预览或拒绝他人候选。

confirm服务显式校验拒绝原因，即使状态被错误改回READY也拒绝；离线renormalize在查询及事务内均拒绝带有拒绝原因的任务，不能把人工拒绝洗成技术通过。拒绝操作不自动生成、不改变最终头像、不延长24h、不将拒绝当成自动照片检测。

当前真实候选已经通过同一Service保存为FAILED + IDENTITY_MISMATCH，私密预览保留、final未变、未确认。本轮只记录用户指出的事实，不声称模型相似度或画风验收通过。

## 验证

- Vitest：26 files / 156 tests通过，含39项真实PostgreSQL集成；覆盖prompt约束、参考发夹移除、本人拒绝、Partner/无关用户拒绝、刷新持久、禁止确认/重新规范化、旧final保护和取消。
- 双端浏览器22/22通过：新增键盘拒绝、刷新、中文/英文、取消；既有Auth/Invitation/Presence回归保持。
- 新migration在独立测试库与本机正式账户库应用，均6/6；不引入测试头像到真实账户。
- build、typecheck、lint、Prisma validate、format/diff通过；production audit为0。
- 本机正式页面已恢复；在用户现有登录会话中核实拒绝标题、无确认按钮/勾选框、私密预览加载成功。

这不是自动身份识别系统。Prompt与参考约束可以降低风险，不能保证下一次模型必然正确；仍需要用户根据真实候选确认身份和画风。无需也没有新增真实调用验证。

提交信息 `fix: reject avatar identity mismatches`；正常push后目标main干净、0/0，完整hash在交付时报告。
