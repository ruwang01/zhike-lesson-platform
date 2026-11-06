'use client';

import { useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import { designSteps } from '@/lib/design-wizard';

export function DataUsageDialog({ onClose, onResetLocal }: {
  onClose: () => void;
  onResetLocal: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal usage-guide"
      aria-labelledby="usage-guide-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <header className="usage-guide-header">
        <p>智课平台指南</p>
        <h2 id="usage-guide-title">数据来源与使用说明</h2>
        <button type="button" className="modal-close" aria-label="关闭说明" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="usage-guide-body" role="region" aria-label="使用说明正文" tabIndex={0}>
        <p className="usage-guide-lead">智课面向国际中文教师。你可以独立查阅知识图谱，也可以从教学需求出发，选择知识、设计活动、审核教案，并把教案排进周课表。</p>
        <section>
          <h3>一、知识图谱与教师输入</h3>
          <p>站内检索接入由华东师范大学参与研发的国际中文教育知识图谱。可查看汉字、词汇、语法和文化条目，以及图谱返回的释义、例句、等级或关联关系。各条目可用的字段不同，未返回的内容以页面实际展示为准。</p>
          <p>课程主题、参考教材、教学材料、学生情况和预期成果来自教师填写。选入教案的图谱条目可在知识卡片或导出的知识依据中核对来源。<a href="https://kg.chineseplus.net/" target="_blank" rel="noreferrer">知识图谱平台</a> · <a href="https://www.ecnu.edu.cn/info/1094/70973.htm" target="_blank" rel="noreferrer">图谱项目介绍</a></p>
        </section>
        <section>
          <h3>二、独立检索知识</h3>
          <p>从侧栏选择汉字检索、词汇检索、语法检索或文化检索，输入关键词后按 Enter 或点击「检索」。点击结果可查看详情和关联关系，结果较多时可翻页。检索无需先建教案，关键词与结果会保留在当前浏览器标签页，浏览过程不会改动教案。</p>
          <p>智课由服务端连接图谱，使用站内账户即可访问。遇到无结果时可更换关键词。遇到请求失败时可重试，连接持续不可用时可联系平台管理员。</p>
        </section>
        <section>
          <h3>三、按七步设计同一份教案</h3>
          <ol>
            {designSteps.map(({ title, description }) => (
              <li key={title}><strong>{title}</strong> · {description}</li>
            ))}
          </ol>
          <p>在图谱选取步骤，可按需选择释义、例句及其他素材。确认后的选项卡保留已选内容，点击「重新选择」可再看其他选项。返回前面的步骤时可继续修改，已填写的信息和已选素材随该教案保存。</p>
        </section>
        <section>
          <h3>四、DeepSeek 草稿、审核与导出</h3>
          <p>使用 AI 设计或修订时，智课会把本课教学需求、经核验的相关知识，以及修订时的原稿和修改要求提交给 DeepSeek。教学活动、教师指令、角色卡和练习属于供教师审阅的教学设计。请在上课前核对事实、语言表达、活动时长、答案和待核验事项。</p>
          <ul>
            <li><strong>导出教师教案</strong> · 获取供备课和授课使用的 Word 教案，包含教学步骤和配套任务。遇到待补全项时可返回编辑。</li>
            <li><strong>导出知识依据</strong> · 单独下载图谱材料包，查阅本课所用释义、例句、关联例题及可用的来源记录。</li>
            <li><strong>导出学生材料</strong> · 下载供学生使用的任务和练习。需要留存可编辑的教案数据时，可使用「备份教案 JSON」，以后通过「导入教案备份」打开。导入后需重新核验图谱来源。</li>
          </ul>
        </section>
        <section>
          <h3>五、站内账号、自动保存与历史教案</h3>
          <p>通过用户名和密码注册并登录，无需手机或邮箱。教案按账户保存，登录后可读取本账户的草稿、已生成教案和可用的历史版本。密码以安全哈希存储。</p>
          <p>编辑时，系统先写入本机，再同步到账号。请留意「保存中」「已保存」或「保存失败，请重试」。若同步失败，可在当前浏览器重试。切换设备后可读取已同步的内容。</p>
          <p>在「历史教案」中可按名称或关键词搜索，按草稿或已生成状态筛选。草稿可继续编辑并恢复上次步骤，已生成教案可查看和编辑。若有历史版本，展开「历史版本」即可打开。</p>
          <p>管理员可查看注册账户数、成功保存教案或生成过教案的去重账户数、当日活跃账户数和成功生成次数，并管理账户状态。</p>
        </section>
        <section>
          <h3>六、安排周课程表</h3>
          <p>用「上一周」「下一周」切换周次，或用「返回今天」回到当前周。点击日期对应的节次格子，可选取历史教案，也可直接填写教案名、课型、时间和地点。点击已排课程可修改，点击垃圾桶可把该课程移出课表。</p>
          <p>排课记录按账户保存在当前浏览器。换设备或清除浏览器站点数据后，本机课表不会随账号教案一起同步。</p>
        </section>
        <section>
          <h3>七、资料授权与课堂使用</h3>
          <p>请按图谱平台和原始材料的授权范围使用释义、例句、例题及外链资源，引用时保留出处。对外发布前请核对使用权限。向模型提交教学材料时，请使用备课所需的内容，避免填写可识别学生身份的信息。</p>
        </section>
      </div>
      <footer className="usage-guide-actions">
        <button type="button" className="text-button" onClick={onResetLocal}><Trash2 size={16} />重置本机当前编辑</button>
        <button type="button" className="primary" onClick={onClose}>完成</button>
      </footer>
    </dialog>
  );
}
